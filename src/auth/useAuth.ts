import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { create } from 'zustand';
import { auth, providers } from './firebase';

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (provider: 'google' | 'github' | 'facebook') => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => {
  onAuthStateChanged(auth, (user) => set({ user, loading: false }));

  return {
    user: null,
    loading: true,
    async login(providerName) {
      const provider = providers[providerName];
      await signInWithPopup(auth, provider);
    },
    async logout() {
      await signOut(auth);
    },
  };
});


