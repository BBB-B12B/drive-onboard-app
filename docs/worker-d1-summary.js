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
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TABLE = "daily_report_summary";

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
      if (request.method === "GET") return handleGet(url, env);
      if (request.method === "POST") return handlePost(request, env);
      if (request.method === "DELETE") return handleDelete(url, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleGet(url, env) {
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

async function handlePost(request, env) {
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

async function handleDelete(url, env) {
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
  const signatureBytes = new Uint8Array(signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(text)
  );
}
