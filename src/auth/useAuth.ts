import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { create } from 'zustand';
import { auth, providers, initError } from './firebase';

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (provider: 'google' | 'github' | 'facebook') => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => {
  if (initError || !auth) {
    // Без Firebase — фолбэк состояние
    set({ user: null, loading: false });
  } else {
    onAuthStateChanged(auth, (user) => set({ user, loading: false }));
  }

  return {
    user: null,
    loading: true,
    async login(providerName) {
      if (!auth || !providers || !(providerName in providers)) {
        return;
      }
      const provider = providers[providerName];
      await signInWithPopup(auth, provider);
    },
    async logout() {
      if (!auth) return;
      await signOut(auth);
    },
  };
});


