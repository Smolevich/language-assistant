import type { WordsRepo } from '../wordsRepo';
import type { Word } from '../../words/store';
import { commonEnglishWords } from '../dictionaries/commonWords';

const STORAGE_KEY = 'la_words_v1';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeRecord(rec: any): Word | null {
  // normalize legacy shapes e.g., { word, transcription } to { term, translation }
  if (!rec) return null;
  const term = rec.term ?? rec.word ?? rec.word?.term ?? null;
  const translation = rec.translation ?? rec.word?.translation ?? '';
  if (!term) return null;
  const transcription = rec.transcription ?? rec.word?.transcription ?? undefined;
  const audio = rec.audio ?? undefined;
  const lang = rec.lang ?? 'en';
  const id = rec.id ?? uid();
  return { id, term, translation, transcription, audio, lang } as Word;
}

function load(): Word[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as any[];
    if (!Array.isArray(parsed)) return [];
    const norm = parsed.map((r) => normalizeRecord(r)).filter(Boolean) as Word[];
    return norm;
  } catch {
    return [];
  }
}

function save(words: Word[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {}
}

export class WordsLocalRepo implements WordsRepo {
  async list(): Promise<Word[]> {
    const words = load();
    if (words.length === 0) {
      await this.loadCommonWords();
      return load();
    }
    return words;
  }
  async add(word: Omit<Word, 'id'>): Promise<Word> {
    const w: Word = { id: uid(), ...word };
    const all = load();
    const updated = [w, ...all];
    save(updated);
    return w;
  }
  async remove(id: string): Promise<void> {
    const all = load();
    save(all.filter((w) => w.id !== id));
  }
  async bulkInsert(words: Omit<Word, 'id'>[]): Promise<void> {
    const all = load();
    const incoming: Word[] = words.map((w) => ({ id: uid(), ...w }));
    save([...incoming, ...all]);
  }
  async clear(): Promise<void> {
    save([]);
  }
  async loadCommonWords(): Promise<void> {
    const wordsToAdd = commonEnglishWords.map((item) => ({
      term: item.word,
      translation: item.translation ?? '',
      transcription: item.transcription ?? undefined,
      lang: 'en',
    }));
    await this.bulkInsert(wordsToAdd);
  }
  async importRawJsonArray(jsonText: string): Promise<number> {
    try {
      const arr = JSON.parse(jsonText);
      if (!Array.isArray(arr)) return 0;
      const mapped = arr
        .map((r: any) => ({
          term: r.term ?? r.word ?? '',
          translation: r.translation ?? '',
          transcription: r.transcription ?? undefined,
          audio: r.audio ?? undefined,
          lang: r.lang ?? 'en',
        }))
        .filter((r: any) => r.term && r.translation);
      await this.bulkInsert(mapped);
      return mapped.length;
    } catch {
      return 0;
    }
  }
}
