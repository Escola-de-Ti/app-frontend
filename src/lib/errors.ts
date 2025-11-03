// src/lib/errors.ts
export function getErrorMessage(e: any, fallback = 'Ocorreu um erro.'): string {
  // Axios?
  const data = e?.response?.data;
  if (typeof data === 'string') return data;
  if (data?.message) return String(data.message);
  if (Array.isArray(data?.errors)) return data.errors.join('\n');
  if (e?.message) return String(e.message);
  return fallback;
}
