import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, tokens, type Tokens } from '../api/client';

type AuthStatus = 'checking' | 'authenticated' | 'anonymous';

type AuthContextValue = {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  status: AuthStatus;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    if (!tokens.get()) {
      setStatus('anonymous');
      return;
    }

    api('/auth/me')
      .then(() => setStatus('authenticated'))
      .catch(() => {
        tokens.clear();
        setStatus('anonymous');
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      async login(username, password) {
        const nextTokens = await api<Tokens>(
          '/auth/login',
          {
            body: JSON.stringify({ password, username }),
            method: 'POST',
          },
          false,
        );

        tokens.set(nextTokens);
        setStatus('authenticated');
      },

      async logout() {
        const currentTokens = tokens.get();

        if (currentTokens) {
          await api(
            '/auth/logout',
            {
              body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
              method: 'POST',
            },
            false,
          ).catch(() => undefined);
        }

        tokens.clear();
        setStatus('anonymous');
      },

      status,
    }),
    [status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
