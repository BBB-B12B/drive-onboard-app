var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// docs/worker-d1-summary.js
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
var TABLE = "daily_report_summary";
var worker_d1_summary_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const auth = request.headers.get("authorization") || "";
    if (!auth.startsWith("Bearer ") || auth.slice(7) !== env.Secret) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (url.pathname === "/api/daily_report_summary") {
      if (request.method === "GET") return handleGet(url, env);
      if (request.method === "POST") return handlePost(request, env);
      if (request.method === "DELETE") return handleDelete(url, env);
    }
    return new Response("Not Found", { status: 404 });
  }
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
__name(handleGet, "handleGet");
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
    last_updated: body.last_updated ?? (/* @__PURE__ */ new Date()).toISOString(),
    status: body.status ?? "missing",
    notes: body.notes ?? null
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
__name(handlePost, "handlePost");
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
__name(handleDelete, "handleDelete");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
__name(json, "json");

// ../../IDE/nvm/versions/node/v20.19.5/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../IDE/nvm/versions/node/v20.19.5/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Cyqkrf/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_d1_summary_default;

// ../../IDE/nvm/versions/node/v20.19.5/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Cyqkrf/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker-d1-summary.js.map
