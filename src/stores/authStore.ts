import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

const API_BASE = 'https://leadgen-backend-production-4e93.up.railway.app';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role?: string;
  useCases?: any[];
  is_super_admin?: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasCheckedAuth: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  checkAuthOnBoot: () => Promise<void>;
  setSession: (user: AuthUser, accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasCheckedAuth: false,
      isLoading: false,

      setSession: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true, hasCheckedAuth: true, isLoading: false });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Login failed' }));
            throw new Error(err.message || 'Login failed');
          }
          const data = await res.json();
          set({
            user: data.user,
            accessToken: data.session?.access_token,
            refreshToken: data.session?.refresh_token,
            isAuthenticated: true,
            hasCheckedAuth: true,
            isLoading: false,
          });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
      },

      logout: () => {
        supabase.auth.signOut().catch(() => {});
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          hasCheckedAuth: true,
          isLoading: false,
        });
      },

      refreshSession: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;
        try {
          const res = await fetch(`${API_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          set({
            accessToken: data.access_token || data.accessToken || data.token,
            refreshToken: data.refresh_token || data.refreshToken || get().refreshToken,
          });
          return true;
        } catch {
          return false;
        }
      },

      checkAuthOnBoot: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ hasCheckedAuth: true, isAuthenticated: false });
          return;
        }
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            set({
              user: data.user || data,
              isAuthenticated: true,
              hasCheckedAuth: true,
              isLoading: false,
            });
          } else if (res.status === 401) {
            const refreshed = await get().refreshSession();
            if (refreshed) {
              // Retry with new token
              const retryRes = await fetch(`${API_BASE}/api/auth/me`, {
                headers: { Authorization: `Bearer ${get().accessToken}` },
              });
              if (retryRes.ok) {
                const data = await retryRes.json();
                set({ user: data.user || data, isAuthenticated: true, hasCheckedAuth: true, isLoading: false });
                return;
              }
            }
            get().logout();
          } else {
            set({ hasCheckedAuth: true, isLoading: false });
          }
        } catch {
          set({ hasCheckedAuth: true, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
