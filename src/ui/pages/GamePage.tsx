import { useEffect, useRef, useState } from 'react';
import { useUserProgress } from '../../user-progress/state';
import type { QuizQuestion } from '../../data/quizQuestions';
import { useWords } from '../../words/store';
import { useAuth } from '../../auth/useAuth';
import { db } from '../../auth/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export function GamePage() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const savedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [savedNow, setSavedNow] = useState(false);
  
  const isFinished = index >= questions.length;
  const q = !isFinished ? questions[index] : null;
  const { ensureLoaded, addLearned } = useUserProgress();
  const { words, ensureLoaded: ensureWordsLoaded, loaded: wordsLoaded } = useWords();
  const { user } = useAuth();
  // --- Offline queue for game results ---
  type GameResult = {
    userId: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    numQuestions: number;
    correct: number;
    finishedAt: number; // epoch ms; serverTimestamp will be set on write
  };

  const PENDING_KEY = 'la_pending_games_v1';

  function loadPending(): GameResult[] {
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as GameResult[]) : [];
    } catch {
      return [];
    }
  }

  function savePending(list: GameResult[]) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(list));
    } catch {}
  }

  async function flushPending() {
    if (!db || !user) return;
    const list = loadPending();
    if (!list.length) return;
    const rest: GameResult[] = [];
    for (const item of list) {
      try {
        await addDoc(collection(db, 'progress', user.uid, 'games'), {
          userId: item.userId,
          level: item.level,
          numQuestions: item.numQuestions,
          correct: item.correct,
          finishedAt: serverTimestamp(),
        });
      } catch {
        rest.push(item);
      }
    }
    savePending(rest);
  }

  useEffect(() => {
    // попытка отправить отложенные результаты при наличии пользователя/сети
    void flushPending();
    const onOnline = () => void flushPending();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, db]);


  useEffect(() => {
    ensureLoaded();
    ensureWordsLoaded();
  }, [ensureLoaded, ensureWordsLoaded]);

  // Не автозапускаем игру — пользователь начинает вручную
  useEffect(() => {
    // intentionally empty
  }, [wordsLoaded]);

  useEffect(() => {
    // Сохраняем результат только если игра действительно была начата и есть вопросы
    if (!started) return;
    if (!isFinished) return;
    if (savedRef.current) return;
    if (questions.length === 0) return;
    savedRef.current = true;
    setSavedNow(true);
    void saveGameResult(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, started, questions.length, score]);

  function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function clampQuestions(n: number): number {
    const minQ = 1; // минимум 1 вопрос
    const maxQ = words.length; // максимум — доступные слова
    const v = Number.isFinite(n) ? Math.round(n) : minQ;
    return Math.min(maxQ, Math.max(minQ, v));
  }

  function buildQuizFromWords(count: number, lvl: 'beginner' | 'intermediate' | 'advanced'): QuizQuestion[] {
    const EXACT_OPTIONS = 4;
    if (!words || words.length < EXACT_OPTIONS) return [];
    const pool = shuffleArray(words);
    const take = Math.min(Math.max(1, count), pool.length);
    const selected = pool.slice(0, take);
    const questionsBuilt: QuizQuestion[] = selected.map((w, idx) => {
      const uniqueTranslations = new Set<string>();
      uniqueTranslations.add(w.translation);
      const candidates = shuffleArray(words);
      for (const cand of candidates) {
        if (uniqueTranslations.size >= EXACT_OPTIONS) break;
        if (cand.term === w.term) continue;
        if (cand.translation === w.translation) continue;
        uniqueTranslations.add(cand.translation);
      }
      const opts = shuffleArray(Array.from(uniqueTranslations).slice(0, EXACT_OPTIONS));
      const correctIndex = opts.findIndex((o) => o === w.translation);
      return {
        id: Date.now() + idx,
        type: 'translation',
        prompt: `Перевод слова "${w.term}"`,
        options: opts,
        correctIndex,
        word: w.term,
        level: lvl,
      };
    });
    return questionsBuilt;
  }

  function handleLevelChange(newLevel: 'beginner' | 'intermediate' | 'advanced') {
    setLevel(newLevel);
    // не перезапускаем игру мгновенно, пользователь может сначала настроить параметры
  }

  function startNewQuiz() {
    setIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    savedRef.current = false;
    setSavedNow(false);
    setQuestions(buildQuizFromWords(numQuestions, level));
    setStarted(true);
  }

  async function saveGameResult(finalScore: number) {
    // Защита от ложного сохранения при не запущенной игре или пустых вопросах
    if (!started || questions.length === 0) return;
    if (user) {
      const payload: GameResult = {
        userId: user.uid,
        level,
        numQuestions: questions.length,
        correct: finalScore,
        finishedAt: Date.now(),
      };
      if (!db) {
        const list = loadPending();
        savePending([...list, payload]);
        return;
      }
      try {
        await addDoc(collection(db, 'progress', user.uid, 'games'), {
          userId: payload.userId,
          level: payload.level,
          numQuestions: payload.numQuestions,
          correct: payload.correct,
          finishedAt: serverTimestamp(),
        });
        // начисляем очки в профиль (суммарно за игру)
        await addLearned(finalScore);
      } catch (e) {
        // откладываем и попробуем снова позже
        const list = loadPending();
        savePending([...list, payload]);
        // eslint-disable-next-line no-console
        console.warn('Game result queued (offline/error)', e);
      }
    }
  }

  async function answer(i: number) {
    if (!started || !q || selectedAnswer !== null) return;
    
    setSelectedAnswer(i);
    setShowResult(true);
    
    const isCorrect = i === q.correctIndex;
    const nextScore = isCorrect ? score + 1 : score;
    setScore(nextScore);

    // если это последний вопрос — завершаем игру сразу и сохраняем результат
    if (index === questions.length - 1 && !savedRef.current) {
      savedRef.current = true;
      setSavedNow(true);
      // переведём индекс за границу, чтобы показать экран завершения
      setIndex(questions.length);
      await saveGameResult(nextScore);
    }
  }

  function nextQuestion() {
    setIndex((x) => x + 1);
    setSelectedAnswer(null);
    setShowResult(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Уровень</label>
          <select
            value={level}
            onChange={(e) => handleLevelChange(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
            disabled={started}
            className="border rounded px-2 py-1"
          >
            <option value="beginner">Low</option>
            <option value="intermediate">Medium</option>
            <option value="advanced">High</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Слов за игру</label>
          <button
            type="button"
            className="px-2 py-1 border rounded text-sm"
            onClick={() => setNumQuestions((v) => clampQuestions(v - 1))}
            disabled={started || !wordsLoaded || numQuestions <= 0}
            aria-label="Уменьшить"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={words.length || 0}
            step={1}
            value={numQuestions}
            disabled={started}
            onChange={(e) => {
              const v = (e.target as HTMLInputElement).valueAsNumber;
              setNumQuestions(clampQuestions(v));
            }}
            onInput={(e) => {
              const v = (e.target as HTMLInputElement).valueAsNumber;
              setNumQuestions(clampQuestions(v));
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setNumQuestions((v) => clampQuestions(v + 1));
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setNumQuestions((v) => clampQuestions(v - 1));
              }
            }}
            onWheel={(e) => {
              if (document.activeElement !== e.currentTarget) return;
              e.preventDefault();
              const delta = Math.sign(e.deltaY);
              setNumQuestions((v) => clampQuestions(v - delta));
            }}
            className="w-24 border rounded px-2 py-1"
          />
          <button
            type="button"
            className="px-2 py-1 border rounded text-sm"
            onClick={() => setNumQuestions((v) => clampQuestions(v + 1))}
            disabled={started || !wordsLoaded || numQuestions >= words.length}
            aria-label="Увеличить"
          >
            +
          </button>
          <span className="text-xs text-gray-500">Доступно: {words.length}</span>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            onClick={() => startNewQuiz()}
            disabled={started || !wordsLoaded || words.length < 1}
          >
            {started ? 'Идёт игра' : 'Начать'}
          </button>
        </div>
      </div>
      {!isFinished && started && q && (
        <>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">Вопрос {index + 1} из {questions.length}</div>
            <div className="text-sm px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {q.type === 'translation' ? 'Перевод' : q.type === 'pronunciation' ? 'Произношение' : 'Определение'}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h1 className="text-2xl font-semibold mb-6 text-center">{q.prompt}</h1>
            <div className="grid gap-3">
              {q.options.map((opt, i) => {
                let buttonClass = "border-2 rounded-lg px-6 py-4 text-left transition-all duration-200 font-medium";
                
                if (showResult) {
                  if (i === q.correctIndex) {
                    buttonClass += " bg-green-50 border-green-500 text-green-700";
                  } else if (i === selectedAnswer) {
                    buttonClass += " bg-red-50 border-red-500 text-red-700";
                  } else {
                    buttonClass += " border-gray-200 text-gray-400";
                  }
                } else {
                  buttonClass += " border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";
                }
                
                return (
                  <button 
                    key={`${q.id}-${i}`} 
                    className={buttonClass} 
                    onClick={() => answer(i)}
                    disabled={selectedAnswer !== null}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-500">Счёт: {score} правильных ответов</div>
            {showResult && (
              <button 
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                onClick={nextQuestion}
              >
                Далее →
              </button>
            )}
          </div>
        </>
      )}

      {!started && (
        <div className="text-center text-sm text-gray-500">Нажмите «Начать», чтобы сгенерировать вопросы.</div>
      )}

      {isFinished && started && (
        <div className="bg-white p-8 rounded-lg shadow-sm border text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">Квиз завершён!</h2>
          <div className="text-4xl font-bold text-blue-600">{score} / {questions.length}</div>
          {savedNow && (
            <div className="text-sm text-green-700">Результат сохранён в профиль</div>
          )}
          <div className="text-lg text-gray-600">
            {score === questions.length ? '🎉 Отлично!' : 
             score >= questions.length * 0.8 ? '👏 Хорошо!' : 
             score >= questions.length * 0.6 ? '👍 Неплохо!' : '💪 Можно лучше!'}
          </div>
          <div className="flex gap-3 justify-center">
            <button 
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium" 
              onClick={() => startNewQuiz()}
            >
              Новый квиз
            </button>
            <button 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium" 
              onClick={() => {
                setIndex(0);
                setScore(0);
                setSelectedAnswer(null);
                setShowResult(false);
              }}
            >
              Повторить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
