import type { WordsRepo } from '../wordsRepo';
import type { Word } from '../../words/store';
import { DuckDBAccessMode } from '@duckdb/duckdb-wasm';
import { MANUAL_BUNDLES } from './bundles';
import { idbGet, idbPut, idbDelete, idbGetText, idbPutText } from './idbStorage';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function esc(val: string | null | undefined) {
  if (val == null) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

export class WordsDuckRepo implements WordsRepo {
  private ready: Promise<void> | null = null;
  private _db: any = null;
  private _conn: any = null;
  private _persistent = false;
  private readonly DB_FILE = 'la_words.db';
  private readonly JSON_BACKUP = 'words_backup_v1.json';

  private async persistSnapshot() {
    // Try to persist the DB file if persistent; otherwise, persist a JSON backup of rows
    try {
      if (this._persistent && this._db) {
        const buf: Uint8Array = await this._db.copyFileToBuffer(this.DB_FILE);
        await idbPut(this.DB_FILE, buf.buffer);
        return;
      }
    } catch {}
    // Fallback: persist JSON dump
    try {
      if (!this._conn) return;
      const res: any = await this._conn.query(
        `SELECT id, term, translation, transcription, audio, lang FROM words;`
      );
      const rows = typeof res?.toArray === 'function' ? res.toArray() : [];
      await idbPutText(this.JSON_BACKUP, JSON.stringify(rows));
    } catch {}
  }

  private async restoreFromJsonBackup() {
    try {
      const text = await idbGetText(this.JSON_BACKUP);
      if (!text) return 0;
      const arr = JSON.parse(text);
      if (!Array.isArray(arr) || arr.length === 0) return 0;
      // Use JSON import path but ensure id field kept
      const name = `tmp_json_restore_${Date.now()}.json`;
      await this._db.registerFileText(name, text);
      await this._conn.query(`
        INSERT INTO words (id, term, translation, transcription, audio, lang)
        SELECT id, term, translation, transcription, audio, lang
        FROM read_json('${name}', format='array', columns={
          id:'VARCHAR', term:'VARCHAR', translation:'VARCHAR', transcription:'VARCHAR', audio:'VARCHAR', lang:'VARCHAR'
        });
      `);
      return arr.length;
    } catch {
      return 0;
    }
  }

  private async ensureReady() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const duckdb: any = await import('@duckdb/duckdb-wasm');
      const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
      const worker = new Worker(bundle.mainWorker);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
      // Попытка восстановить снимок БД из IndexedDB (если OPFS был недоступен ранее)
      try {
        const snap = await idbGet(this.DB_FILE);
        if (snap) {
          await db.registerFileBuffer(this.DB_FILE, new Uint8Array(snap));
        }
      } catch {}
      // Открываем файл БД в OPFS; при ошибке "invalid database" пробуем удалить и создать заново,
      // затем, если всё ещё не удалось, падаем в in-memory режим
      const disableOpfs = typeof localStorage !== 'undefined' && localStorage.getItem('la_duckdb_no_opfs') === '1';
      if (!disableOpfs) {
        const openOpts = { path: this.DB_FILE, accessMode: DuckDBAccessMode.READ_WRITE } as any;
        try {
          await db.open(openOpts);
          this._persistent = true;
        } catch (e: any) {
          const msg = (e && (e.message || e.toString())) as string;
          if (msg && msg.includes('not a valid DuckDB database')) {
            try {
              if (typeof (db as any).dropFile === 'function') {
                await (db as any).dropFile(this.DB_FILE);
              }
            } catch {}
            await idbDelete(this.DB_FILE);
            // Disable OPFS for next runs to avoid error spam
            try { localStorage.setItem('la_duckdb_no_opfs', '1'); } catch {}
            await db.open(); // Switch to in-memory; we'll restore from JSON backup
            this._persistent = false;
          } else {
            await db.open();
            this._persistent = false;
          }
        }
      } else {
        await db.open();
        this._persistent = false;
      }
      const conn = await db.connect();
      await conn.query(`
        CREATE TABLE IF NOT EXISTS words (
          id VARCHAR PRIMARY KEY,
          term VARCHAR NOT NULL,
          translation VARCHAR NOT NULL,
          transcription VARCHAR,
          audio VARCHAR,
          lang VARCHAR
        );
      `);
      // Try to ensure JSON extension is available
      try {
        await conn.query(`INSTALL json; LOAD json;`);
      } catch {}
      await conn.query(`CREATE INDEX IF NOT EXISTS idx_words_term ON words(term);`);
      this._db = db;
      this._conn = conn;
      if (!this._persistent) {
        console.warn('[DuckDB] Using in-memory database (not persisted).');
      }
      // Если таблица пустая — пытаемся восстановить из JSON бэкапа
      const cntRes: any = await conn.query(`SELECT COUNT(*)::INT AS n FROM words;`);
      const n = (typeof cntRes?.toArray === 'function' ? cntRes.toArray() : [{ n: 0 }])[0].n as number;
      if (n === 0) {
        await this.restoreFromJsonBackup();
      }
      // Сохраняем снимок/бэкап
      await this.persistSnapshot();
    })();
    return this.ready;
  }

  async list(): Promise<Word[]> {
    await this.ensureReady();
    const res: any = await this._conn.query(
      `SELECT id, term, translation, transcription, audio, lang FROM words ORDER BY id DESC;`
    );
    const rows = typeof res?.toArray === 'function' ? res.toArray() : [];
    return rows as Word[];
  }

  async add(word: Omit<Word, 'id'>): Promise<Word> {
    await this.ensureReady();
    const w: Word = { id: uid(), ...word };
    await this._conn.query(
      `INSERT INTO words (id, term, translation, transcription, audio, lang) VALUES (${esc(
        w.id
      )}, ${esc(w.term)}, ${esc(w.translation)}, ${esc(w.transcription ?? null)}, ${esc(
        w.audio ?? null
      )}, ${esc(w.lang ?? null)});`
    );
    try { await this._conn.query('CHECKPOINT;'); await this._db.flushFiles(); } catch {}
    await this.persistSnapshot();
    return w;
  }

  async remove(id: string): Promise<void> {
    await this.ensureReady();
    await this._conn.query(`DELETE FROM words WHERE id = ${esc(id)};`);
    try { await this._conn.query('CHECKPOINT;'); await this._db.flushFiles(); } catch {}
    await this.persistSnapshot();
  }

  async bulkInsert(words: Omit<Word, 'id'>[]): Promise<void> {
    await this.ensureReady();
    if (!words.length) return;

    const chunkSize = 2000;
    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).map((w) => {
        const id = uid();
        return `(${esc(id)}, ${esc(w.term)}, ${esc(w.translation)}, ${esc(
          w.transcription ?? null
        )}, ${esc(w.audio ?? null)}, ${esc(w.lang ?? null)})`;
      });
      const sql = `INSERT INTO words (id, term, translation, transcription, audio, lang) VALUES ${chunk.join(
        ', '
      )};`;
      await this._conn.query(sql);
    }
    try { await this._conn.query('CHECKPOINT;'); await this._db.flushFiles(); } catch {}
    await this.persistSnapshot();
  }

  async clear(): Promise<void> {
    await this.ensureReady();
    await this._conn.query(`DELETE FROM words;`);
    try { await this._conn.query('CHECKPOINT;'); await this._db.flushFiles(); } catch {}
    await this.persistSnapshot();
  }

  async importRawJsonArray(jsonText: string): Promise<number> {
    await this.ensureReady();
    const name = `tmp_import_${Date.now()}.json`;
    await this._db.registerFileText(name, jsonText);
    const prefix = Math.random().toString(36).slice(2, 10);
    const sql = `
      WITH src AS (
        SELECT * FROM read_json('${name}', format='array', columns={
          term: 'VARCHAR',
          word: 'VARCHAR',
          translation: 'VARCHAR',
          transcription: 'VARCHAR',
          audio: 'VARCHAR',
          lang: 'VARCHAR'
        })
      ), prep AS (
        SELECT
          COALESCE(term, word) AS term,
          COALESCE(translation, '') AS translation,
          transcription,
          audio,
          COALESCE(lang, 'en') AS lang
        FROM src
      ), numbered AS (
        SELECT row_number() OVER () AS rn, term, translation, transcription, audio, lang FROM prep
      )
      INSERT INTO words (id, term, translation, transcription, audio, lang)
      SELECT concat('${prefix}', '-', rn), term, translation, transcription, audio, lang FROM numbered;
    `;
    await this._conn.query(sql);
    try { await this._conn.query('CHECKPOINT;'); await this._db.flushFiles(); } catch {}
    await this.persistSnapshot();
    const countRes: any = await this._conn.query(`SELECT count(*)::INT AS n FROM read_json('${name}', format='array', columns={term:'VARCHAR', word:'VARCHAR', translation:'VARCHAR', transcription:'VARCHAR', audio:'VARCHAR', lang:'VARCHAR'});`);
    const rows = typeof countRes?.toArray === 'function' ? countRes.toArray() : [];
    return rows.length ? rows[0].n : 0;
  }
}
