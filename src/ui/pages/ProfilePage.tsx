import { useAuth } from '../../auth/useAuth';
import { useUserProgress } from '../../user-progress/state';

export function ProfilePage() {
  const { user } = useAuth();
  const { totalLearned, streakDays } = useUserProgress();

  if (!user) return <div>Войдите, чтобы видеть прогресс</div>;

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
    </div>
  );
}


