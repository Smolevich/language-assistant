import { useEffect, useMemo, useState } from 'react';
import { useWords } from '../../words/store';

export function DictionaryPage() {
  const { words, addWord, removeWord, ensureLoaded } = useWords();
  const [term, setTerm] = useState('');
  const [translation, setTranslation] = useState('');
  const [transcription, setTranscription] = useState('');
  const [q, setQ] = useState('');

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

  return (
    <div className="space-y-6">
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
        <div className="text-sm text-gray-500 min-w-fit ml-2">Всего: {words.length}</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
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
