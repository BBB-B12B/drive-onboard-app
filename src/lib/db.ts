import { drizzle } from 'drizzle-orm/d1';

import { drizzle as drizzleProxy } from 'drizzle-orm/sqlite-proxy';

import * as schema from '@/db/schema';
import { mapKeys, camelCase } from 'lodash';

// Interface for global DB cache
declare global {
    var _dbPromiseRemote: any;
    var _dbPromiseLocal: any;
}

// OpenNext Context Helper
async function getOpenNextBinding() {
    try {
        // @ts-ignore
        const { getCloudflareContext } = await import("@opennextjs/cloudflare");
        const { env } = await getCloudflareContext();
        return env.DB;
    } catch (e) {
        return null;
    }
}

export const getDb = async () => {
    // console.log('[getDb] Checking connection mode...');

    // 0. Try OpenNext Binding (Requests)
    const openNextDB = await getOpenNextBinding();
    if (openNextDB) {
        // console.log('[getDb] Using OpenNext Cloudflare Binding');
        return drizzle(openNextDB as any, { schema });
    }

    // 1. Production / Cloudflare Environment (Standard Worker process.env)
    if (process.env.DB) {
        console.log('[getDb] Using Cloudflare Binding (process.env.DB present)');
        return drizzle(process.env.DB as any, { schema });
    }

    // 2. Remote D1 Mode (Local Node.js connecting to Remote D1 via API)
    // Requires: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, CLOUDFLARE_D1_TOKEN
    if (process.env.USE_REMOTE_D1 === 'true') {
        if (!global._dbPromiseRemote) {
            const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
            const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
            const token = process.env.CLOUDFLARE_D1_TOKEN;

            if (!accountId || !databaseId || !token) {
                throw new Error('Remote D1 requires CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_DATABASE_ID, and CLOUDFLARE_D1_TOKEN');
            }

            global._dbPromiseRemote = drizzleProxy(async (sql, params, method) => {
                const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            sql: sql,
                            params: params,
                        }),
                        cache: 'no-store'
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('D1 API Error:', errorText);
                        throw new Error(`D1 API failed: ${response.statusText}`);
                    }

                    const result = await response.json();

                    if (!result.success) {
                        console.error('D1 Query Error:', result.errors);
                        throw new Error(result.errors?.[0]?.message || 'Unknown D1 error');
                    }

                    // D1 API returns an array of results. We usually send one query at a time here.
                    const firstResult = result.result?.[0];
                    if (!firstResult) return { rows: [] };

                    // console.log('[Drizzle Proxy] SQL:', sql);

                    // DEBUG: Log the first row to verify format and values
                    // if (firstResult.results && firstResult.results.length > 0) {
                    //     console.log('[Drizzle Proxy] Raw Row[0]:', JSON.stringify(firstResult.results[0], null, 2));
                    // }

                    // FIX: Drizzle sqlite-proxy expects an array of values, not an object.
                    let columns: string[] = [];
                    const normalizedSql = sql.toLowerCase();

                    // Case 1: INSERT/UPDATE ... RETURNING ...
                    const returningMatch = normalizedSql.match(/returning\s+(.*)$/);
                    if (returningMatch) {
                        columns = returningMatch[1].split(',').map(s => s.trim().replace(/["`]/g, '')); // Remove quotes
                    } else {
                        // Case 2: SELECT ... FROM ...
                        const selectMatch = normalizedSql.match(/^\s*select\s+(?:distinct\s+)?(.*?)\s+from/);
                        if (selectMatch) {
                            columns = selectMatch[1].split(',').map(s => s.trim().replace(/["`]/g, ''));
                        }
                    }

                    if (columns.length > 0) {
                        // Clean column names (handle aliases if simple "col as alias", roughly)
                        // Drizzle usually generates "col" or "col" as "unique_name".
                        // D1 returns keys matching the requested name (usually).
                        // For now, assume simple stripping works.

                        const mappedRows = (firstResult.results || []).map((row: any) => {
                            return columns.map(col => {
                                // Handle table.col case
                                const cleanCol = col.includes('.') ? col.split('.')[1] : col;
                                return row[cleanCol] ?? row[col] ?? null;
                            });
                        });

                        // FIX: For 'get' method, drizzle expects the single row's values array, not an array of rows.
                        if (method === 'get') {
                            return { rows: mappedRows[0] || [] };
                        }

                        return { rows: mappedRows };
                    }

                    // Fallback (might fail for some queries if SQL parsing fails)
                    return { rows: firstResult.results || [] };
                } catch (e) {
                    console.error('Remote D1 Exception:', e);
                    throw e;
                }
            }, async (queries: { sql: string; params: any[]; method: 'run' | 'all' | 'values' | 'get'; }[]) => {
                // Batch query implementation (Drizzle Proxy 'batch' callback)
                const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
                // Drizzle sends multiple queries. The D1 batch endpoint is similar but usually simply posting multiple statements is safer individually 
                // OR D1 API supports batching via specific endpoint `.../query` accepting array? No, D1 API `query` endpoint accepts `sql` string. 
                // For proxy batching, we usually iterate or use D1 batch endpoint if available (it is /query with multiple statements separated by ; ? No).
                // Simplest consistent way for this proxy: Run them sequentially or Promise.all.
                // However, Drizzle expects a single Promise returning array of results.

                // Note: The sqlite-proxy driver defined type handles the return structure.
                // We will map over queries and fire Promise.all for simplicity in this dev tool.

                const responses = await Promise.all(queries.map(async (q) => {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ sql: q.sql, params: q.params }),
                        cache: 'no-store'
                    });
                    const json = await res.json();

                    const mappedRows = (json.result?.[0]?.results || []).map((row: any) => {
                        return mapKeys(row, (_v, k) => camelCase(k));
                    });

                    return { rows: mappedRows };
                }));

                return responses;
            }, { schema });
        }
        return global._dbPromiseRemote;
    }

    // 3. Local Development (SQLite File) - REMOVED to fix OpenNext Build
    if (!global._dbPromiseLocal) {
        console.log('Local SQLite fallback is disabled for Production Build stability.');
        console.log('Please use `wrangler dev` or `USE_REMOTE_D1=true` for local development.');
        // Return null or throw? Returning null might break things.
        // Let's fallback to Remote logic or just throw.
        // throw new Error("Local SQLite fallback disabled. Use 'npm run dev:all' or 'wrangler dev'.");
        return undefined as any;
    }
    return global._dbPromiseLocal;
};

export const verifyBinding = async () => {
    const openNextDB = await getOpenNextBinding();
    if (openNextDB) return "OpenNext Binding (Found)";
    if (process.env.DB) return "Process.env.DB (Found)";
    if (process.env.USE_REMOTE_D1 === 'true') return "Remote Proxy (Configured)";
    return "Fallback: Local SQLite (Empty)";
};
