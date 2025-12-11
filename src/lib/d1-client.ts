type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

const base = process.env.D1_API_BASE;
const token = process.env.D1_API_TOKEN;

export function isD1Enabled(): boolean {
  return Boolean(base && token);
}

interface D1Response<T> {
  data?: T;
  error?: string;
}

export async function d1Request<T>(path: string, options: { method?: HttpMethod; body?: unknown } = {}): Promise<D1Response<T>> {
  if (!isD1Enabled()) {
    return { error: "D1 is not configured" };
  }

  const url = `${base}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  if (!res.ok) {
    return { error: text || `D1 request failed with status ${res.status}` };
  }

  try {
    const parsed = text ? (JSON.parse(text) as T) : ({} as T);
    return { data: parsed };
  } catch (error) {
    return { error: "Failed to parse D1 response" };
  }
}
