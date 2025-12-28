import { getCloudflareContext } from "@opennextjs/cloudflare";

// Proxy Class to bridge Node.js to Remote Worker (Local Dev only)
class R2ProxyBucket {
    private endpoint: string;
    private secret: string;

    constructor(endpoint: string) {
        this.endpoint = endpoint;
        // Use .dev.vars secret or default. Ideally strictly from env.
        this.secret = process.env.WORKER_SECRET || process.env.Secret || "dev-secret-token";
    }

    async list(options?: any) {
        const params = new URLSearchParams();
        if (options?.prefix) params.set("prefix", options.prefix);
        if (options?.delimiter) params.set("delimiter", options.delimiter);
        if (options?.limit) params.set("limit", options.limit.toString());

        const res = await fetch(`${this.endpoint}/list?${params.toString()}`, {
            headers: { Authorization: `Bearer ${this.secret}` }
        });
        if (!res.ok) throw new Error(`R2 Proxy List Failed: ${res.statusText}`);
        return await res.json();
    }

    async get(key: string) {
        const res = await fetch(`${this.endpoint}/${encodeURIComponent(key)}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${this.secret}` }
        });

        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`R2 Proxy Get Failed: ${res.statusText}`);

        // Mimic R2ObjectBody
        const arrayBuffer = await res.arrayBuffer();
        return {
            body: new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array(arrayBuffer));
                    controller.close();
                }
            }),
            arrayBuffer: async () => arrayBuffer,
            text: async () => new TextDecoder().decode(arrayBuffer),
            json: async () => JSON.parse(new TextDecoder().decode(arrayBuffer)),
            httpMetadata: {
                contentType: res.headers.get("content-type") || undefined,
            },
            httpEtag: res.headers.get("etag") || undefined,
        };
    }

    async put(key: string, body: any, options?: any) {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${this.secret}`
        };
        if (options?.httpMetadata?.contentType) {
            headers['Content-Type'] = options.httpMetadata.contentType;
        }

        const res = await fetch(`${this.endpoint}/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers,
            body: body // fetch supports string, buffer, stream
        });

        if (!res.ok) throw new Error(`R2 Proxy Put Failed: ${res.statusText}`);
        return { key };
    }

    async delete(keys: string | string[]) {
        // Proxy currently supports single key delete.
        // If array, loop it (simple polyfill)
        const keyList = Array.isArray(keys) ? keys : [keys];

        for (const key of keyList) {
            const res = await fetch(`${this.endpoint}/${encodeURIComponent(key)}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${this.secret}` }
            });
            if (!res.ok) console.error(`R2 Proxy Delete Failed for ${key}`);
        }
    }
}

export async function getR2Binding(): Promise<any> {
    try {
        // 1. Try OpenNext Context (Production/Preview)
        const { env } = await getCloudflareContext();
        if (env.R2) {
            return env.R2 as R2Bucket;
        }
    } catch (e) {
        // Ignore OpenNext errors in Node.js
    }

    // 2. Fallback: Check global env (Legacy Worker)    
    // @ts-ignore
    if (process.env.R2) {
        // @ts-ignore
        return process.env.R2 as R2Bucket;
    }

    // 3. Dev Proxy Mode (If configured or if simple local dev detection)
    // We assume if we are here, we are on Local Node.js and want to talk to Worker at 8787
    // Ensure this only runs if we expect a remote worker.
    if (process.env.USE_REMOTE === 'true' || process.env.NODE_ENV === 'development') {
        // console.log("[R2 Binding] Using Local Proxy to http://127.0.0.1:8787/api/r2-proxy");
        return new R2ProxyBucket("http://127.0.0.1:8787/api/r2-proxy");
    }

    console.warn("[R2 Binding] No R2 binding found and no proxy configured.");
    return null;
}
