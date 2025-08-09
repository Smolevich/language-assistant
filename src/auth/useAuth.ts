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
        alert('Авторизация недоступна: неверная конфигурация Firebase');
        return;
      }
      const provider = providers[providerName];
      try {
        await signInWithPopup(auth, provider);
      } catch (e: any) {
        console.error('Sign-in failed', e);
        alert(`Ошибка входа: ${e?.code || e?.message || 'unknown_error'}`);
      }
    },
    async logout() {
      if (!auth) return;
      await signOut(auth);
    },
  };
});


