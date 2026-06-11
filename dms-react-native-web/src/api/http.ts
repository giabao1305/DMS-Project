import { API_URLS } from "../config/env";
import { toVietnameseError } from "../utils/errorMessage";
import { clearSession, getStoredSession, notifySessionExpired, storeSession, type Session } from "./authStore";

const REQUEST_TIMEOUT_MS = 4000;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: string;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    const message = toVietnameseError(normalizeErrorMessage(payload) || `Request failed (${status})`);
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return requestInternal<T>(path, options, true);
}

async function requestInternal<T>(
  path: string,
  options: RequestOptions,
  allowRefresh: boolean,
): Promise<T> {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth !== false && session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const response = await fetchWithFallback(path, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 401 && allowRefresh && options.auth !== false) {
    const refreshed = await refreshSession(session);
    if (refreshed) return requestInternal<T>(path, options, false);
    notifySessionExpired();
  }

  const payload = await readPayload(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}

async function fetchWithFallback(path: string, init: RequestInit) {
  for (const baseUrl of API_URLS) {
    try {
      return await fetchWithTimeout(`${baseUrl}${path}`, init);
    } catch {
    }
  }

  throw new ApiError(0, {
    message: "Mất kết nối",
  });
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function refreshSession(session: Session | null) {
  if (!session?.refreshToken) return false;

  try {
    const refreshed = await requestInternal<Session>(
      "/auth/refresh",
      {
        method: "POST",
        auth: false,
        body: { refreshToken: session.refreshToken },
      },
      false,
    );
    storeSession(refreshed);
    return true;
  } catch {
    clearSession();
    return false;
  }
}

async function readPayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function normalizeErrorMessage(payload: unknown) {
  if (typeof payload === "string") return toVietnameseError(payload);
  if (!payload || typeof payload !== "object") return undefined;
  const data = payload as ApiErrorPayload;
  if (Array.isArray(data.message)) return toVietnameseError(data.message.join(", "));
  return toVietnameseError(data.message || data.error);
}
