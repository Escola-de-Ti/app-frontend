import { Platform } from 'react-native';

type StoreLike = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

const ACCESS_TOKEN_KEY = 'kh.accessToken';
const REFRESH_TOKEN_KEY = 'kh.refreshToken';

// Fallback para web (usa localStorage)
const webStorage: StoreLike = {
  async getItemAsync(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  async setItemAsync(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  async deleteItemAsync(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

// Resolve a store em tempo de execução, sem require()
async function getStore(): Promise<StoreLike> {
  if (Platform.OS === 'web') return webStorage;

  try {
    // Import dinâmico só em device (Android/iOS)
    const ss = await import('expo-secure-store');
    // Mapeia apenas o que precisamos, mantendo a tipagem
    const storeLike: StoreLike = {
      getItemAsync: ss.getItemAsync,
      setItemAsync: ss.setItemAsync,
      deleteItemAsync: ss.deleteItemAsync,
    };
    return storeLike;
  } catch {
    // Se por algum motivo falhar (ambiente sem o pacote), cai no webStorage
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
}
