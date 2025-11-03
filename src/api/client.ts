import axios, { AxiosError, AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'kh.accessToken';
const REFRESH_TOKEN_KEY = 'kh.refreshToken';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}
export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
export async function setTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

export const api: AxiosInstance = axios.create({ baseURL, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (v?: unknown) => void; reject: (e: any) => void; request: any }[] = [];

function processQueue(error: any = null) {
  pendingQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(true);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;
    const status = error.response?.status;

    if (status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({
            resolve: async () => {
              try {
                const token = await getAccessToken();
                original.headers = original.headers ?? {};
                if (token) original.headers.Authorization = `Bearer ${token}`;
                original._retry = true;
                resolve(api(original));
              } catch (e) {
                reject(e);
              }
            },
            reject,
            request: original,
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          await clearTokens();
          return Promise.reject(error);
        }

        const resp = await axios.post(`${baseURL}/api/usuarios/refresh`, { refreshToken });
        const newAccess = (resp.data?.accessToken ?? resp.data?.token) as string;
        const newRefresh = (resp.data?.refreshToken ?? refreshToken) as string;
        if (!newAccess) throw new Error('Refresh sem accessToken');

        await setTokens(newAccess, newRefresh);
        processQueue();

        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        processQueue(e);
        await clearTokens();
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
