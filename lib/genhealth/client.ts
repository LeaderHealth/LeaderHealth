import fs from "node:fs";
import path from "node:path";
import { ALLOW_LIVE_GENHEALTH_ORDERS } from "./flags";

const DEFAULT_BASE_URL = "https://api.gen-health.app";
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type LabThreeGenHealth = {
  apiKey?: string;
  publicApiBaseUrl?: string;
};

function labThreeGenHealth(): LabThreeGenHealth | null {
  try {
    const source = fs.readFileSync(path.join(process.cwd(), "firebase/functions/config.js"), "utf8");
    const key = source.match(/GEN_HEALTH_API_KEY\s*\|\|\s*"([^"]+)"/)?.[1];
    const publicApiBaseUrl = source.match(/GEN_HEALTH_PUBLIC_API_BASE_URL\s*\|\|\s*"([^"]+)"/)?.[1];
    return {
      apiKey: key?.trim(),
      publicApiBaseUrl: publicApiBaseUrl?.trim(),
    };
  } catch {
    return null;
  }
}

function credentials() {
  const labThree = labThreeGenHealth();
  const apiKey = process.env.GEN_HEALTH_API_KEY?.trim() || labThree?.apiKey?.trim() || "";
  const publicApiBaseUrl = (
    process.env.GEN_HEALTH_PUBLIC_API_BASE_URL?.trim() ||
    labThree?.publicApiBaseUrl?.trim() ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
  return { apiKey, publicApiBaseUrl };
}

export class GenHealthError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown = null) {
    super(message);
    this.name = "GenHealthError";
    this.status = status;
    this.payload = payload;
  }
}

export function genHealthConfigured() {
  return Boolean(credentials().apiKey);
}

function apiKey() {
  const key = credentials().apiKey;
  if (!key) {
    throw new GenHealthError("GEN_HEALTH_API_KEY is not configured.", 500);
  }
  return key;
}

function baseUrl() {
  return credentials().publicApiBaseUrl;
}

export type GenHealthEnvelope<T = Record<string, unknown>> = {
  success: boolean;
  status: number;
  error: string | null;
  data: T | null;
};

export async function genHealthRequest<T = Record<string, unknown>>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | undefined> } = {},
): Promise<GenHealthEnvelope<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  if (WRITE_METHODS.has(method) && !ALLOW_LIVE_GENHEALTH_ORDERS) {
    return {
      success: false,
      status: 403,
      error: "Live GenHealth writes are disabled until checkout is approved.",
      data: null,
    };
  }

  const url = new URL(`${baseUrl()}${path.startsWith("/") ? path : `/${path}`}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    accept: "application/json",
    "x-api-key": apiKey(),
  };

  const init: RequestInit = { method, headers, cache: "no-store" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error contacting GenHealth.";
    return {
      success: false,
      status: 502,
      error: message,
      data: null,
    };
  }

  let payload: { success?: boolean; error?: string; message?: string; data?: T } | null = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as typeof payload;
    } catch {
      payload = { success: false, error: text };
    }
  }

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      error: payload?.error || payload?.message || `GenHealth API error (${response.status})`,
      data: (payload?.data as T | undefined) ?? null,
    };
  }

  return {
    success: payload?.success !== false,
    status: response.status,
    error: payload?.error ?? null,
    data: (payload?.data as T | undefined) ?? (payload as T | null),
  };
}
