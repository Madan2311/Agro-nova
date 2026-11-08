import { computed } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { User } from './auth.models';

const STORAGE_KEY = 'agro_session';

interface AuthState {
  token: string | null;
  user: User | null;
}

function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
  }
  return { token: null, user: null };
}

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(loadSession()),
  withComputed(({ token, user }) => ({
    isAuthenticated: computed(() => !!token()),
    isAdmin: computed(() => user()?.role === 'admin'),
  })),
  withMethods((store) => ({
    setSession(token: string, user: User): void {
      patchState(store, { token, user });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
      } catch {
      }
    },
    clear(): void {
      patchState(store, { token: null, user: null });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
      }
    },
  })),
);