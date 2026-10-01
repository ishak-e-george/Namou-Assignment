import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HttpError } from '../../api/http.js';
import * as authApi from '../../api/auth.api.js';
import type { AuthUser } from '../../api/auth.api.js';

const authMeKey = ['auth', 'me'] as const;

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: authMeKey,
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        if (error instanceof HttpError && error.status === 401) return { user: null };
        throw error;
      }
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (result) => queryClient.setQueryData(authMeKey, result),
  });
  const logoutMutation = useMutation({ mutationKey: ['auth', 'logout'], mutationFn: authApi.logout });

  const value = useMemo<AuthContextValue>(() => ({
    user: userQuery.data?.user ?? null,
    isLoading: userQuery.isLoading,
    login: async (email, password) => { await loginMutation.mutateAsync({ email, password }); },
    logout: async () => {
      try {
        await logoutMutation.mutateAsync();
      } finally {
        queryClient.clear();
        queryClient.setQueryData(authMeKey, { user: null });
      }
    },
  }), [userQuery.data?.user, userQuery.isLoading, loginMutation, logoutMutation, queryClient]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
