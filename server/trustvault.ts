const TRUSTVAULT_BASE = "https://trustvault.replit.app/api/v1";
const SERVICE_ID = "the-void";
const API_KEY = process.env.TRUSTVAULT_API_KEY || "";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getServiceToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const res = await fetch(`${TRUSTVAULT_BASE}/auth/service-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serviceId: SERVICE_ID,
      apiKey: API_KEY,
      scope: ["media:write", "media:read", "media:delete"],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[TrustVault] Auth failed:", res.status, text);
    throw new Error(`TrustVault auth failed: ${res.status}`);
  }

  const data = (await res.json()) as { token: string; expiresIn: number };
  cachedToken = data.token;
  tokenExpiresAt = Date.now() + data.expiresIn * 1000;
  console.log("[TrustVault] Service token acquired, expires in", data.expiresIn, "s");
  return cachedToken;
}

async function authHeaders(userId?: string): Promise<Record<string, string>> {
  const token = await getServiceToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (userId) headers["X-Void-User"] = userId;
  return headers;
}

export interface TrustVaultUploadParams {
  trustLayerId: string;
  voidId?: string | null;
  mediaType: "audio" | "image";
  format: string;
  encoding: "base64" | "utf-8";
  data: string;
  source: "vent" | "voice-journal" | "void-echo" | "mood-portrait";
  metadata?: Record<string, any>;
  collection?: string;
  tags?: string[];
  title?: string;
}

export interface TrustVaultMediaResult {
  success: boolean;
  mediaId: string;
  url: string;
  sizeBytes?: number;
  storedAt?: string;
}

export interface TrustVaultMediaItem {
  mediaId: string;
  mediaType: string;
  format: string;
  url: string;
  cdnUrl?: string;
  metadata?: Record<string, any>;
  sizeBytes?: number;
  createdAt?: string;
  source?: string;
  title?: string;
  tags?: string[];
}

export async function uploadMedia(params: TrustVaultUploadParams): Promise<TrustVaultMediaResult> {
  const headers = await authHeaders(params.trustLayerId);
  const body = {
    userId: params.trustLayerId,
    voidId: params.voidId || undefined,
    mediaType: params.mediaType,
    format: params.format,
    encoding: params.encoding,
    data: params.data,
    metadata: {
      source: params.source,
      ...params.metadata,
    },
    collection: params.collection || params.source + "s",
    tags: params.tags || [params.source],
    title: params.title,
  };

  const res = await fetch(`${TRUSTVAULT_BASE}/media/upload`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[TrustVault] Upload failed:", res.status, text);
    throw new Error(`TrustVault upload failed: ${res.status}`);
  }

  return (await res.json()) as TrustVaultMediaResult;
}

export async function getMedia(mediaId: string, trustLayerId?: string): Promise<TrustVaultMediaItem | null> {
  try {
    const headers = await authHeaders(trustLayerId);
    const res = await fetch(`${TRUSTVAULT_BASE}/media/${mediaId}`, { headers });

    if (!res.ok) {
      if (res.status === 404) return null;
      console.error("[TrustVault] Get media failed:", res.status);
      return null;
    }

    return (await res.json()) as TrustVaultMediaItem;
  } catch (e: any) {
    console.error("[TrustVault] Get media error:", e.message);
    return null;
  }
}

export async function deleteMedia(mediaId: string, trustLayerId?: string): Promise<boolean> {
  try {
    const headers = await authHeaders(trustLayerId);
    const res = await fetch(`${TRUSTVAULT_BASE}/media/${mediaId}`, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch (e: any) {
    console.error("[TrustVault] Delete failed:", e.message);
    return false;
  }
}

export interface BatchResult {
  items: TrustVaultMediaItem[];
  total: number;
  hasMore: boolean;
}

export async function getUserMedia(
  trustLayerId: string,
  options?: { source?: string; limit?: number; offset?: number; sort?: "newest" | "oldest" }
): Promise<BatchResult> {
  try {
    const headers = await authHeaders(trustLayerId);
    const params = new URLSearchParams();
    if (options?.source) params.set("source", options.source);
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.sort) params.set("sort", options.sort);

    const url = `${TRUSTVAULT_BASE}/media/user/${trustLayerId}?${params.toString()}`;
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error("[TrustVault] Batch retrieval failed:", res.status);
      return { items: [], total: 0, hasMore: false };
    }

    return (await res.json()) as BatchResult;
  } catch (e: any) {
    console.error("[TrustVault] Batch retrieval error:", e.message);
    return { items: [], total: 0, hasMore: false };
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${TRUSTVAULT_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export function isTrustVaultMediaId(value: string | null | undefined): boolean {
  return !!value && value.startsWith("tv-media-");
}
