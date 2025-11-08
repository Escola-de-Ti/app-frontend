import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../lib/secure';

const DEFAULT_BASE = Platform.select({
  ios: 'http://localhost:8080',
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});
const baseURL = (process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE)!;

console.log('[API] baseURL =', baseURL);

export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Client-Platform': Platform.OS,
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
    // console.log('[API] Auth header ON');
  } else {
    // console.log('[API] sem token');
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: { resolve: (v?: unknown) => void; reject: (e: any) => void; request: any }[] = [];

function processQueue(error: any = null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(true)));
  pendingQueue = [];
}

const REFRESH_PATH = '/api/usuarios/refresh';

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data as any;
    console.log('❌ API ERROR', status, data || error.message);

    const original = error.config as any;

    const isRefreshCall = !!original?.url && String(original.url).includes(REFRESH_PATH);

    if (status === 401 && !original?._retry && !isRefreshCall) {
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

        const resp = await axios.post(
          `${baseURL}${REFRESH_PATH}`,
          { refreshToken },
          {
            timeout: 20000,
            headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          }
        );

        const newAccess = (resp.data as any)?.accessToken ?? (resp.data as any)?.token;
        const newRefresh = (resp.data as any)?.refreshToken ?? refreshToken;
        if (!newAccess) throw new Error('Refresh sem accessToken');

        await setTokens(newAccess, newRefresh);
        processQueue(); // libera a fila

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

    // 403 -> token inválido/sem permissão (muitos backends retornam 403 com token vencido também)
    if (status === 403) {
      await clearTokens();
    }

    return Promise.reject(error);
  }
);
