function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '/api/v1';
  }
  if (process.env.API_INTERNAL_URL) {
    return process.env.API_INTERNAL_URL.replace(/\/+$/, '');
  }
  if (process.env.API_HOSTPORT) {
    const hp = process.env.API_HOSTPORT.startsWith('http')
      ? process.env.API_HOSTPORT
      : `http://${process.env.API_HOSTPORT}`;
    return `${hp.replace(/\/+$/, '')}/api/v1`;
  }
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:4000/api/v1';
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { next?: { revalidate?: number } } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
    cache: options.cache ?? (typeof window === 'undefined' ? 'no-store' : undefined),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      (data as { message?: string; error?: string } | null)?.message ||
      (data as { error?: string } | null)?.error ||
      `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export function formatDate(raw: string | null | undefined): string {
  if (!raw) return 'Date unavailable';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
