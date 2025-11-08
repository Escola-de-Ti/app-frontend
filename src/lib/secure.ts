import { Platform } from 'react-native';

type StoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

const ACCESS_TOKEN_KEY = 'kh.accessToken';
const REFRESH_TOKEN_KEY = 'kh.refreshToken';
const USER_ID_KEY = 'kh.userId';

// Fallback web
const webStorage: StoreLike = {
  async getItemAsync(key) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItemAsync(key, value) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async deleteItemAsync(key) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

async function getStore(): Promise<StoreLike> {
  if (Platform.OS === 'web') return webStorage;
  try {
    const ss = await import('expo-secure-store');
    const storeLike: StoreLike = {
      getItemAsync: ss.getItemAsync,
      setItemAsync: ss.setItemAsync,
      deleteItemAsync: ss.deleteItemAsync,
    };
    return storeLike;
  } catch {
    return webStorage;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const store = await getStore();
  return store.getItemAsync(ACCESS_TOKEN_KEY);
}
export async function getRefreshToken(): Promise<string | null> {
  const store = await getStore();
  return store.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  const store = await getStore();
  await store.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await store.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function clearTokens(): Promise<void> {
  const store = await getStore();
  await store.deleteItemAsync(ACCESS_TOKEN_KEY);
  await store.deleteItemAsync(REFRESH_TOKEN_KEY);
  await store.deleteItemAsync(USER_ID_KEY);
}

/** Salva userId vindo do login ou decodificado do token */
export async function setCurrentUserId(userId: number | string): Promise<void> {
  const store = await getStore();
  await store.setItemAsync(USER_ID_KEY, String(userId));
}
export async function getStoredUserId(): Promise<number | null> {
  const store = await getStore();
  const raw = await store.getItemAsync(USER_ID_KEY);
  const n = raw != null ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Decodifica JWT só com base64 (sem libs) e tenta ler sub/userId/id */
function decodeJwtClaims(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? decodeURIComponent(escape(atob(b64)))
        : Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Tenta descobrir o userId: 1) do JWT; 2) do storage */
export async function getCurrentUserId(): Promise<number | null> {
  const token = await getAccessToken();
  if (token) {
    const claims = decodeJwtClaims(token);
    if (claims) {
      const candidate = claims.sub ?? claims.userId ?? claims.userid ?? claims.id;
      const n = candidate != null ? Number(candidate) : NaN;
      if (Number.isFinite(n)) {
        // cacheia
        await setCurrentUserId(n);
        return n;
      }
    }
  }
  return getStoredUserId();
}

/** Útil no fluxo de login: salva tokens + userId (quando o back retornar) */
export async function setAuthSession(params: {
  accessToken: string;
  refreshToken: string;
  userId?: number | string | null;
}) {
  await setTokens(params.accessToken, params.refreshToken);
  if (params.userId != null) {
    await setCurrentUserId(params.userId);
  } else {
    // tenta extrair do token
    await getCurrentUserId();
  }
}
