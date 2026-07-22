const API_BASE_URL = '/api';
const TOKEN_STORAGE_KEY = 'mini.tokens';

export type Tokens = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokens = {
  clear(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  get(): Tokens | null {
    const value = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as Tokens;
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
  },

  set(value: Tokens): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(value));
  },
};

let refreshInFlight: Promise<Tokens> | null = null;

async function parseError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join(', ')
    : (body?.message ?? `HTTP ${response.status}`);

  return new ApiError(message, response.status);
}

async function refreshTokens(refreshToken: string): Promise<Tokens> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE_URL}/auth/refresh`, {
      body: JSON.stringify({ refreshToken }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await parseError(response);
        }

        const nextTokens = (await response.json()) as Tokens;
        tokens.set(nextTokens);
        return nextTokens;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  const currentTokens = tokens.get();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(currentTokens ? { Authorization: `Bearer ${currentTokens.accessToken}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401 && retryAfterRefresh && currentTokens) {
    try {
      await refreshTokens(currentTokens.refreshToken);
      return api<T>(path, init, false);
    } catch {
      tokens.clear();
    }
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
