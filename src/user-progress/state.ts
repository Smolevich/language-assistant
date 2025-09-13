import { doc, getDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';
import { create } from 'zustand';
import { db } from '../auth/firebase';
import { useAuth } from '../auth/useAuth';

type Progress = {
  totalLearned: number;
  streakDays: number;
  lastActivityAt?: number;
};

type ProgressState = Progress & {
  ensureLoaded: () => Promise<void>;
  addLearned: (count?: number) => Promise<void>;
};

export const useUserProgress = create<ProgressState>((set) => ({
  totalLearned: 0,
  streakDays: 0,
  async ensureLoaded() {
    const user = useAuth.getState().user;
    if (!user || !db) return;
    const ref = doc(db, 'progress', user.uid);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as Progress;
        set({ ...data });
      } else {
        const initial: Progress = { totalLearned: 0, streakDays: 0 };
        await setDoc(ref, { ...initial, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        set(initial);
      }
    } catch (e) {
      // офлайн/400 — не ломаем UI, оставляем дефолтные значения
      // eslint-disable-next-line no-console
      console.warn('ensureLoaded skipped due to Firestore error', e);
      set((s) => ({ totalLearned: s.totalLearned ?? 0, streakDays: s.streakDays ?? 0 }));
    }
  },
  async addLearned(count = 1) {
    const user = useAuth.getState().user;
    if (!user || !db) return;
    const ref = doc(db, 'progress', user.uid);
    try {
      await updateDoc(ref, { totalLearned: increment(count), updatedAt: serverTimestamp() });
    } catch {
      // если документа ещё нет или офлайн — создаём/обновляем через setDoc merge
      try {
        await setDoc(ref, { totalLearned: increment(count), updatedAt: serverTimestamp() }, { merge: true } as any);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('addLearned skipped due to Firestore error', e);
      }
    }
    set((s) => ({ totalLearned: s.totalLearned + count, streakDays: s.streakDays }));
  },
}));

