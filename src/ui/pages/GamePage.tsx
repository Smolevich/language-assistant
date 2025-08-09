import { useEffect, useState } from 'react';
import { useUserProgress } from '../../user-progress/state';

const questions = [
  {
    id: 1,
    prompt: 'Столица of France?',
    options: ['Berlin', 'Paris', 'Rome', 'Madrid'],
    correctIndex: 1,
  },
  {
    id: 2,
    prompt: 'Largest ocean?',
    options: ['Atlantic', 'Indian', 'Pacific', 'Arctic'],
    correctIndex: 2,
  },
];

export function GamePage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const isFinished = index >= questions.length;
  const q = !isFinished ? questions[index] : null;
  const { ensureLoaded, addLearned } = useUserProgress();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  async function answer(i: number) {
    if (!q) return;
    const isLast = index + 1 === questions.length;
    const isCorrect = i === q.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      await addLearned(1);
    }
    setIndex((x) => x + 1);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {!isFinished && q && (
        <>
          <div className="text-sm text-gray-500">Вопрос {index + 1} / {questions.length}</div>
          <h1 className="text-xl font-semibold">{q.prompt}</h1>
          <div className="grid gap-2">
            {q.options.map((opt, i) => (
              <button key={opt} className="border rounded px-4 py-2 text-left hover:bg-gray-50" onClick={() => answer(i)}>
                {opt}
              </button>
            ))}
          </div>
        </>
      )}

      {isFinished && (
        <div className="mt-4 space-y-2">
          <div className="font-medium">Ваш счёт: {score} / {questions.length}</div>
          <button className="px-3 py-1 border rounded" onClick={() => { setIndex(0); setScore(0); }}>
            Пройти ещё раз
          </button>
        </div>
      )}
    </div>
  );
}


