import { useEffect, useMemo, useState } from 'react';
import { getWordsRepo } from '../../data';
import { useAuth } from '../../auth/useAuth';
import { db, isFirebaseConfigured } from '../../auth/firebase';
import { uploadWordsToFirestore } from '../../data/server/sync';
import { useWords } from '../../words/store';

export function DictionaryPage() {
  const { words, addWord, removeWord, ensureLoaded, importWords, clearAll, reload, loaded } = useWords();
  const { user } = useAuth();
  const [term, setTerm] = useState('');
  const [translation, setTranslation] = useState('');
  const [transcription, setTranscription] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return words;
    return words.filter(
      (w) =>
        w.term.toLowerCase().includes(t) ||
        w.translation.toLowerCase().includes(t)
    );
  }, [q, words]);

  useEffect(() => {
    setPage(0);
  }, [q, filtered.length]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = page * pageSize;
  const end = Math.min(start + pageSize, total);
  const visible = filtered.slice(start, end);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim() || !translation.trim()) return;
    await addWord({ term: term.trim(), translation: translation.trim(), transcription: transcription.trim() || undefined, lang: 'en' });
    setTerm('');
    setTranslation('');
    setTranscription('');
  }

  if (!loaded) {
    return <div className="max-w-xl mx-auto text-center">Загрузка словаря...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 items-center">
        <label className="px-3 py-2 border rounded cursor-pointer hover:bg-gray-50">
          Импорт JSON
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const inputEl = e.currentTarget as HTMLInputElement;
              const file = inputEl.files?.[0];
              if (!file) return;
              const text = await file.text();
              try {
                const repo: any = getWordsRepo();
                if (typeof repo.importRawJsonArray === 'function') {
                  const n = await repo.importRawJsonArray(text);
                  await reload();
                  alert(`Импортировано: ${n}`);
                } else {
                  // Fallback: parse in JS and bulkInsert
                  const arr = JSON.parse(text);
                  if (!Array.isArray(arr)) throw new Error('Ожидается массив объектов');
                  const mapped = arr
                    .map((r: any) => ({
                      term: r.term ?? r.word ?? '',
                      translation: r.translation ?? '',
                      transcription: r.transcription ?? undefined,
                      audio: r.audio ?? undefined,
                      lang: r.lang ?? 'en',
                    }))
                    .filter((r: any) => r.term && r.translation);
                  await importWords(mapped);
                  alert(`Импортировано: ${mapped.length}`);
                }
              } catch (err: any) {
                alert(`Ошибка импорта: ${err?.message ?? err}`);
              } finally {
                // reset the hidden file input safely even after re-render
                try { inputEl.value = ''; } catch {}
              }
            }}
          />
        </label>
        <button
          className="px-3 py-2 border rounded hover:bg-gray-50"
          onClick={() => {
            const payload = words.map(({ id, ...rest }) => rest);
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dictionary-export.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Экспорт JSON
        </button>
        {isFirebaseConfigured && user && (
          <button
            disabled={syncing || words.length === 0}
            className={`px-3 py-2 border rounded ${syncing ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            onClick={async () => {
              if (!db || !user) return;
              if (!confirm(`Выгрузить ${words.length} слов на сервер? Это может занять время и операции Firestore.`)) return;
              setSyncing(true);
              setSynced(null);
              try {
                const { written } = await uploadWordsToFirestore({ db, user, words });
                setSynced(written);
                alert(`Выгружено: ${written}`);
              } catch (e: any) {
                alert(`Ошибка выгрузки: ${e?.message ?? e}`);
              } finally {
                setSyncing(false);
              }
            }}
            title="Синхронизировать словарь в Firestore"
          >
            {syncing ? 'Синхронизация…' : 'Синхронизировать в Firestore'}
          </button>
        )}
        <button
          className="px-3 py-2 border rounded hover:bg-gray-50 text-red-600"
          onClick={async () => {
            if (confirm('Очистить словарь?')) await clearAll();
          }}
        >
          Очистить
        </button>
        {synced != null && (
          <span className="text-xs text-gray-500">Последняя выгрузка: {synced} слов</span>
        )}
      </div>

      <form onSubmit={onAdd} className="grid gap-3 sm:grid-cols-5">
        <input
          className="border rounded px-3 py-2 sm:col-span-2"
          placeholder="Слово (term)"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 sm:col-span-2"
          placeholder="Перевод (translation)"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
        />
        <input
          className="border rounded px-3 py-2 sm:col-span-1"
          placeholder="Транскрипция (опц.)"
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
        />
        <button className="border rounded px-3 py-2 sm:col-span-1">Добавить</button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder="Поиск по словарю..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex items-center gap-2 min-w-fit ml-2 text-sm text-gray-600">
          <span>Найдено: {total} из {words.length}</span>
          <span>|</span>
          <label className="flex items-center gap-1">
            На странице:
            <select
              className="border rounded px-2 py-1"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </label>
          <span>|</span>
          <div className="flex items-center gap-1">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              title="Назад"
            >
              ←
            </button>
            <span>
              {total === 0 ? 0 : page + 1} / {totalPages}
            </span>
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              title="Вперёд"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((w) => (
          <div key={w.id} className="border rounded p-4 flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <div className="text-lg font-semibold">{w.term}</div>
              <button
                className="text-xs text-red-600 hover:underline"
                onClick={() => removeWord(w.id)}
                title="Удалить"
              >
                удалить
              </button>
            </div>
            {w.transcription && (
              <div className="text-sm text-gray-500">{w.transcription}</div>
            )}
            <div className="text-gray-700">{w.translation}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
