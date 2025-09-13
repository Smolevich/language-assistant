import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useUserProgress } from '../../user-progress/state';
import { db, isFirebaseConfigured } from '../../auth/firebase';
import { collection, limit, orderBy, query, Timestamp, getDocs } from 'firebase/firestore';

export function ProfilePage() {
  const { user } = useAuth();
  const { totalLearned, streakDays } = useUserProgress();
  const [games, setGames] = useState<Array<{ id: string; level?: string; numQuestions?: number; correct?: number; finishedAt?: any }>>([]);
  const [loadingGames, setLoadingGames] = useState(true);

  useEffect(() => {
    async function loadOnce() {
      try {
        if (!db || !user) return;
        const ref = collection(db, 'progress', user.uid, 'games');
        const q = query(ref, orderBy('finishedAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setGames(rows);
      } finally {
        setLoadingGames(false);
      }
    }

    if (!user || !db || !isFirebaseConfigured) {
      setGames([]);
      setLoadingGames(false);
      return;
    }
    setLoadingGames(true);
    loadOnce();
  }, [user]);

  const prettyGames = useMemo(() => {
    return games.map((g) => {
      let dateStr = '—';
      const fa = g.finishedAt as any;
      try {
        if (fa instanceof Timestamp) dateStr = fa.toDate().toLocaleString();
        else if (fa && typeof fa.toDate === 'function') dateStr = fa.toDate().toLocaleString();
        else if (typeof fa === 'number') dateStr = new Date(fa).toLocaleString();
      } catch {}
      return { ...g, dateStr };
    });
  }, [games]);

  if (!user) return <div>Войдите, чтобы видеть прогресс</div>;
  if (!isFirebaseConfigured) return <div>Firebase не сконфигурирован. Авторизация и сохранение прогресса недоступны.</div>;

  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-center gap-3">
        {user.photoURL && <img src={user.photoURL} alt="avatar" className="w-12 h-12 rounded-full" />}
        <div>
          <div className="font-semibold">{user.displayName || user.email}</div>
          <div className="text-sm text-gray-500">UID: {user.uid}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Выучено слов</div>
          <div className="text-2xl font-bold">{totalLearned}</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Серия дней</div>
          <div className="text-2xl font-bold">{streakDays}</div>
        </div>
      </div>

      <div className="border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">История игр</div>
          <div className="text-xs text-gray-500">{loadingGames ? 'Загрузка…' : `Всего: ${games.length}`}</div>
        </div>
        {(!games || games.length === 0) && !loadingGames && (
          <div className="text-sm text-gray-500">Пока нет сохранённых игр.</div>
        )}
        {games && games.length > 0 && (
          <div className="divide-y">
            {prettyGames.map((g) => (
              <div key={g.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{g.level || '—'}</span>
                  <span className="text-gray-500">{g.dateStr}</span>
                </div>
                <div className="text-gray-700">{g.correct ?? 0} / {g.numQuestions ?? 0}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
