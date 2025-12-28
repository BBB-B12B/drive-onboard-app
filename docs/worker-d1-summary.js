/**
 * Cloudflare Worker for Daily Report summary backed by D1.
 *
 * Bindings required:
 * - DB: D1 database (table daily_report_summary, see docs/d1-daily-report-summary.sql)
 * - Secret: Bearer token to protect the API
 *
 * Routes:
 *   GET    /api/daily_report_summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&email=optional
 *   POST   /api/daily_report_summary   (upsert)
 *   DELETE /api/daily_report_summary?email=...&date=YYYY-MM-DD
 *   GET    /api/users
 *   POST   /api/users      (create)
 *   GET    /api/users/:id  (fetch by id)
 *   PUT    /api/users/:id  (update)
 *   DELETE /api/users/:id  (delete)
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TABLE = "daily_report_summary";
const USERS_TABLE = "users";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // File Proxy Route (Public Access with Signature)
    // Matches /files/:key*
    if (url.pathname.startsWith("/files/")) {
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          }
        });
      }
      if (request.method === "GET") return handleGetFile(request, url, env);
      return new Response("Method Not Allowed", { status: 405 });
    }

    // API Routes (Protected)
    // Bearer auth
    const auth = request.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== env.Secret) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Route handling
    if (url.pathname === "/api/daily_report_summary") {
      if (request.method === "GET") return handleGetSummary(url, env);
      if (request.method === "POST") return handlePostSummary(request, env);
      if (request.method === "DELETE") return handleDeleteSummary(url, env);
    }

    // R2 Proxy Routes (For Local Dev Bridge)
    // Protected by same Bearer Secret
    if (url.pathname.startsWith("/api/r2-proxy")) {
      const auth = request.headers.get("authorization") || "";
      if (!auth.startsWith("Bearer ") || auth.slice(7) !== env.Secret) {
        return new Response("Unauthorized Proxy Access", { status: 401 });
      }

      // Handle R2 Proxy
      if (request.method === "GET" && url.pathname === "/api/r2-proxy/list") return handleProxyList(url, env);
      if (request.method === "GET") return handleProxyGet(url, env);
      if (request.method === "PUT") return handleProxyPut(request, url, env);
      if (request.method === "DELETE") return handleProxyDelete(url, env);
    }

    // User Management Routes
    if (url.pathname.startsWith("/api/users")) {
      if (request.method === "GET") return handleGetUsers(url, env);
      if (request.method === "POST") return handlePostUsers(request, env);

      // ID-based routes
      const idMatch = url.pathname.match(/^\/api\/users\/([^\/]+)$/);
      if (idMatch) {
        const id = idMatch[1];
        if (request.method === "GET") return handleGetUserById(id, env);
        if (request.method === "PUT") return handleUpdateUser(id, request, env);
        if (request.method === "DELETE") return handleDeleteUser(id, env);
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

// --- R2 Proxy Handlers (Bridge for Local Node.js) ---

async function handleProxyList(url, env) {
  const prefix = url.searchParams.get("prefix") || "";
  const delimiter = url.searchParams.get("delimiter");
  const limit = url.searchParams.get("limit");

  // R2 List Options
  const options = {
    prefix,
    limit: limit ? parseInt(limit) : undefined,
    delimiter: delimiter || undefined
  };

  const result = await env.R2.list(options);
  return json(result);
}

async function handleProxyGet(url, env) {
  // Path: /api/r2-proxy/<key>
  const key = decodeURIComponent(url.pathname.slice("/api/r2-proxy/".length));
  if (!key) return new Response("Missing Key", { status: 400 });

  const object = await env.R2.get(key);
  if (!object) return new Response("Object Not Found", { status: 404 });

  // Return raw body
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, { headers });
}

async function handleProxyPut(request, url, env) {
  // Path: /api/r2-proxy/<key>
  const key = decodeURIComponent(url.pathname.slice("/api/r2-proxy/".length));
  if (!key) return new Response("Missing Key", { status: 400 });

  const contentType = request.headers.get("content-type");

  // Put stream
  await env.R2.put(key, request.body, {
    httpMetadata: {
      contentType: contentType || undefined,
    }
  });

  return json({ ok: true, key });
}

async function handleProxyDelete(url, env) {
  // Path: /api/r2-proxy/<key>
  const key = decodeURIComponent(url.pathname.slice("/api/r2-proxy/".length));
  if (!key) return new Response("Missing Key", { status: 400 });

  await env.R2.delete(key);
  return json({ ok: true, deleted: key });
}

// --- Daily Report Summary Handlers ---

async function handleGetSummary(url, env) {
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const email = url.searchParams.get("email");

  if (!startDate || !endDate || !DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return json({ error: "startDate/endDate (YYYY-MM-DD) are required" }, 400);
  }

  let sql = `SELECT email, date, full_name, app_id, uploaded_count, total_slots, last_updated, status, notes
             FROM ${TABLE}
             WHERE date >= ? AND date <= ?`;
  const params = [startDate, endDate];

  if (email) {
    sql += " AND lower(email) = lower(?)";
    params.push(email);
  }

  sql += " ORDER BY date ASC, full_name ASC";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json(results ?? []);
}

async function handlePostSummary(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  const { email, date } = body;
  if (!email || !date || !DATE_RE.test(date)) {
    return json({ error: "email and date (YYYY-MM-DD) are required" }, 400);
  }

  const row = {
    full_name: body.full_name ?? email,
    app_id: body.app_id ?? email,
    uploaded_count: Number(body.uploaded_count ?? 0),
    total_slots: Number(body.total_slots ?? 0),
    last_updated: body.last_updated ?? new Date().toISOString(),
    status: body.status ?? "missing",
    notes: body.notes ?? null,
  };

  const stmt = env.DB.prepare(
    `INSERT OR REPLACE INTO ${TABLE}
     (email, date, full_name, app_id, uploaded_count, total_slots, last_updated, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    email,
    date,
    row.full_name,
    row.app_id,
    row.uploaded_count,
    row.total_slots,
    row.last_updated,
    row.status,
    row.notes
  );

  await stmt.run();
  return json({ ok: true });
}

async function handleDeleteSummary(url, env) {
  const email = url.searchParams.get("email");
  const date = url.searchParams.get("date");
  if (!email || !date || !DATE_RE.test(date)) {
    return json({ error: "email and date (YYYY-MM-DD) are required" }, 400);
  }

  const res = await env.DB.prepare(
    `DELETE FROM ${TABLE} WHERE lower(email) = lower(?) AND date = ?`
  ).bind(email, date).run();

  if (res.changes === 0) {
    return json({ error: "Not Found" }, 404);
  }
  return new Response(null, { status: 204 });
}

// --- User Handlers ---

async function handleGetUsers(url, env) {
  const email = url.searchParams.get("email");
  if (email) {
    const { results } = await env.DB.prepare(`SELECT * FROM ${USERS_TABLE} WHERE lower(email) = lower(?)`).bind(email).all();
    return json(results ?? []);
  }
  const { results } = await env.DB.prepare(`SELECT * FROM ${USERS_TABLE}`).all();
  return json(results ?? []);
}

async function handleGetUserById(id, env) {
  const user = await env.DB.prepare(`SELECT * FROM ${USERS_TABLE} WHERE id = ?`).bind(id).first();
  if (!user) return json({ error: "User not found" }, 404);
  return json(user);
}

async function handlePostUsers(request, env) {
  const body = await request.json().catch(() => null);
  // Basic validation
  if (!body || !body.email || !body.name) return json({ error: "Missing fields" }, 400); // Allow missing id if we want to generate it? but d1-users generates it.

  const id = body.id || crypto.randomUUID();

  try {
    await env.DB.prepare(
      `INSERT INTO ${USERS_TABLE} (id, email, name, role, password_hash, avatar_url, phone) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, body.email, body.name, body.role, body.password_hash, body.avatar_url, body.phone).run();
    return json({ ok: true, id });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleUpdateUser(id, request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid JSON" }, 400);

  // Build dynamic update
  const fields = [];
  const values = [];
  if (body.email !== undefined) { fields.push("email = ?"); values.push(body.email); }
  if (body.name !== undefined) { fields.push("name = ?"); values.push(body.name); }
  if (body.role !== undefined) { fields.push("role = ?"); values.push(body.role); }
  if (body.password_hash !== undefined) { fields.push("password_hash = ?"); values.push(body.password_hash); }
  if (body.avatar_url !== undefined) { fields.push("avatar_url = ?"); values.push(body.avatar_url); }
  if (body.phone !== undefined) { fields.push("phone = ?"); values.push(body.phone); }

  if (fields.length === 0) return json({ ok: true });

  values.push(id);
  const sql = `UPDATE ${USERS_TABLE} SET ${fields.join(", ")} WHERE id = ?`;

  try {
    await env.DB.prepare(sql).bind(...values).run();
    const user = await env.DB.prepare(`SELECT * FROM ${USERS_TABLE} WHERE id = ?`).bind(id).first();
    return json(user);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleDeleteUser(id, env) {
  await env.DB.prepare(`DELETE FROM ${USERS_TABLE} WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

// --- R2 Handlers ---

async function handleGetFile(request, url, env) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  };

  const key = url.pathname.slice("/files/".length);
  // Note: key might be URL encoded by browser. R2.get() expects raw key.
  const decodedKey = decodeURIComponent(key);

  const signature = url.searchParams.get("signature");
  if (!signature) return new Response("Missing signature", { status: 401, headers: corsHeaders });

  // Verify Signature
  // content to sign: r2Key (decoded raw string)
  const valid = await verifyHmac(decodedKey, signature, env.Secret);
  if (!valid) {
    return new Response("Invalid signature", { status: 403, headers: corsHeaders });
  }

  const object = await env.R2.get(decodedKey);

  if (object === null) {
    return new Response("Object Not Found", { status: 404, headers: corsHeaders });
  }

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

  return new Response(object.body, {
    headers,
  });
}

// Helper: HMAC-SHA256 Verification
async function verifyHmac(text, signatureHex, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Check if signatureHex is valid hex
  try {
    const signatureBytes = new Uint8Array(signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(text)
    );
  } catch (e) {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
