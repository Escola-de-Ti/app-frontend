/**
 * JWT utils sem require(), sem APIs deprecadas e compatível com RN/Web.
 * Faz decode base64url -> UTF-8 sem dependências externas.
 */

/* base64url -> bytes (Uint8Array) */
function b64urlToBytes(b64url: string): Uint8Array {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4;
  if (pad) b64 += '='.repeat(4 - pad);

  const lookup: number[] = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;

  b64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');

  const len = b64.length;
  const placeHolders = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array(((len * 3) >> 2) - placeHolders);

  let L = 0;
  for (let i = 0; i < len; i += 4) {
    const a = lookup[b64.charCodeAt(i)];
    const b = lookup[b64.charCodeAt(i + 1)];
    const c = lookup[b64.charCodeAt(i + 2)];
    const d = lookup[b64.charCodeAt(i + 3)];

    bytes[L++] = (a << 2) | (b >> 4);
    if (L < bytes.length && c !== undefined) {
      bytes[L++] = ((b & 0x0f) << 4) | (c >> 2);
    }
    if (L < bytes.length && d !== undefined) {
      bytes[L++] = ((c & 0x03) << 6) | d;
    }
  }
  return bytes;
}

/* bytes (UTF-8) -> string */
function utf8BytesToString(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
  // fallback manual
  let out = '';
  for (let i = 0; i < bytes.length; ) {
    const b0 = bytes[i++];
    if (b0 < 0x80) {
      out += String.fromCharCode(b0);
      continue;
    }
    if (b0 >= 0xc0 && b0 < 0xe0) {
      const b1 = bytes[i++];
      const cp = ((b0 & 0x1f) << 6) | (b1 & 0x3f);
      out += String.fromCharCode(cp);
      continue;
    }
    if (b0 >= 0xe0 && b0 < 0xf0) {
      const b1 = bytes[i++];
      const b2 = bytes[i++];
      const cp = ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      out += String.fromCharCode(cp);
      continue;
    }
    // 4 bytes (surrogate pair)
    const b1 = bytes[i++];
    const b2 = bytes[i++];
    const b3 = bytes[i++];
    const cp = ((b0 & 0x07) << 18) | ((b1 & 0x3f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
    const offset = cp - 0x10000;
    out += String.fromCharCode(0xd800 + (offset >> 10));
    out += String.fromCharCode(0xdc00 + (offset & 0x3ff));
  }
  return out;
}

export type JwtPayload = Record<string, unknown>;

/** Decodifica o payload do JWT (sem verificar assinatura). */
export function decodeJwt(token?: string | null): JwtPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const bytes = b64urlToBytes(parts[1]);
    const json = utf8BytesToString(bytes);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/** Extrai o userId comum (claims 'id' ou 'sub'). */
export function getUserIdFromJwt(token?: string | null): string | null {
  const payload = decodeJwt(token);
  if (!payload) return null;
  const id =
    typeof (payload as { id?: unknown }).id === 'string' ? (payload as { id?: string }).id! : null;
  const sub =
    typeof (payload as { sub?: unknown }).sub === 'string'
      ? (payload as { sub?: string }).sub!
      : null;
  return id ?? sub;
}
