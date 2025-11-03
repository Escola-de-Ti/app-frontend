import axios, { AxiosError, AxiosInstance } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../lib/secure';

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';
console.log('[API] baseURL =', process.env.EXPO_PUBLIC_API_BASE_URL);

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
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(true)));
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
        const newAccess = (resp.data as any)?.accessToken ?? (resp.data as any)?.token;
        const newRefresh = (resp.data as any)?.refreshToken ?? refreshToken;
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
