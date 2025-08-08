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

export const useUserProgress = create<ProgressState>((set, get) => ({
  totalLearned: 0,
  streakDays: 0,
  async ensureLoaded() {
    const user = useAuth.getState().user;
    if (!user) return;
    const ref = doc(db, 'progress', user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Progress;
      set({ ...data });
    } else {
      const initial: Progress = { totalLearned: 0, streakDays: 0 };
      await setDoc(ref, { ...initial, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      set(initial);
    }
  },
  async addLearned(count = 1) {
    const user = useAuth.getState().user;
    if (!user) return;
    const ref = doc(db, 'progress', user.uid);
    await updateDoc(ref, { totalLearned: increment(count), updatedAt: serverTimestamp() });
    set((s) => ({ totalLearned: s.totalLearned + count, streakDays: s.streakDays }));
  },
}));


