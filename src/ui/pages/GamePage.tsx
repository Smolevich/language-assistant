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
  const q = questions[index];
  const { ensureLoaded, addLearned } = useUserProgress();

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  async function answer(i: number) {
    if (i === q.correctIndex) {
      setScore((s) => s + 1);
      await addLearned(1);
    }
    if (index + 1 < questions.length) setIndex((x) => x + 1);
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="text-sm text-gray-500">Вопрос {index + 1} / {questions.length}</div>
      <h1 className="text-xl font-semibold">{q.prompt}</h1>
      <div className="grid gap-2">
        {q.options.map((opt, i) => (
          <button key={opt} className="border rounded px-4 py-2 text-left hover:bg-gray-50" onClick={() => answer(i)}>
            {opt}
          </button>
        ))}
      </div>
      {index + 1 === questions.length && (
        <div className="mt-4 font-medium">Ваш счёт: {score} / {questions.length}</div>
      )}
    </div>
  );
}


