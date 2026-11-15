import { create } from 'zustand';

// The access token lives in memory only (ADR-0004). A page reload gets a new one
// from the httpOnly refresh cookie.
interface AuthState {
  status: 'loading' | 'in' | 'out';
  accessToken: string | null;
}
export const useAuth = create<AuthState>(() => ({ status: 'loading', accessToken: null }));

const signedIn = (accessToken: string) => useAuth.setState({ status: 'in', accessToken });
const signedOut = () => useAuth.setState({ status: 'out', accessToken: null });

export class ApiError extends Error {
  constructor(
    public status: number,
    /** Stable code from the API, used to pick a translated message. */
    public code: string,
  ) {
    super(code);
  }
}

interface ErrorBody {
  error?: { code?: string };
}

async function send(path: string, method: string, body?: unknown) {
  const token = useAuth.getState().accessToken;
  try {
    return await fetch('/api' + path, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'network');
  }
}

let refreshing: Promise<boolean> | null = null;

/** Trades the refresh cookie for a new access token. Parallel callers share one request. */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await send('/auth/refresh', 'POST');
      if (!res.ok) throw new ApiError(res.status, 'unauthorized');
      signedIn(((await res.json()) as { accessToken: string }).accessToken);
      return true;
    } catch {
      signedOut();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  let res = await send(path, method, options.body);
  // Access token expired: get a new one and try once more.
  if (res.status === 401 && useAuth.getState().accessToken && (await refreshSession())) {
    res = await send(path, method, options.body);
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => null)) as (T & ErrorBody) | null;
  if (!res.ok || data === null) {
    throw new ApiError(res.status, data?.error?.code ?? 'server_error');
  }
  return data;
}

type Credentials = { phone: string; password: string; shopName?: string };

export async function authenticate(kind: 'login' | 'signup', body: Credentials) {
  const { accessToken } = await api<{ accessToken: string }>(`/auth/${kind}`, {
    method: 'POST',
    body,
  });
  signedIn(accessToken);
}

export async function logout() {
  await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
  signedOut();
}

export interface Me {
  id: string;
  phone: string;
  tenant: { id: string; name: string };
}
