var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-JKtFaP/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
var src_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    const rawPath = new URL(request.url).pathname;
    const pathname = rawPath.startsWith("/api/") ? rawPath.slice(4) : rawPath;
    const { accountId, userId } = getIdentity(request);
    const db = env.DB;
    const r2 = env.R2;
    const PUBLIC_R2_BASE_URL = env.PUBLIC_R2_BASE_URL || null;
    try {
      if (pathname === "/health") {
        return json({ ok: true, env: "local", ts: (/* @__PURE__ */ new Date()).toISOString() });
      }
      if (pathname.startsWith("/alerts")) {
        if (request.method === "GET") {
          const { results } = await db.prepare(
            "SELECT * FROM v_alerts_active WHERE account_id = ? AND user_id = ? ORDER BY timestamp DESC"
          ).bind(accountId, userId).all();
          const parseAlert = /* @__PURE__ */ __name((a) => ({
            ...a,
            coordinates: parseMaybeJson(a.coordinates),
            affected_crops: parseMaybeJson(a.affected_crops),
            notes: parseMaybeJson(a.notes)
          }), "parseAlert");
          return json(results.map(parseAlert));
        }
        if (request.method === "POST") {
          try {
            const ct = request.headers.get("content-type") || "";
            let body = {};
            let photoName = null;
            let photoUrl = null;
            if (ct.includes("multipart/form-data")) {
              const form = await request.formData();
              body = {};
              for (const [k, v] of form.entries()) {
                if (v instanceof File) {
                  if (k === "photo") photoName = v.name || null;
                  if (r2 && v) {
                    const key = `alerts/${accountId}/${userId}/${Date.now()}_${photoName || "photo"}`;
                    await r2.put(key, await v.arrayBuffer(), { httpMetadata: { contentType: v.type || "application/octet-stream" } });
                    if (PUBLIC_R2_BASE_URL) photoUrl = `${PUBLIC_R2_BASE_URL}/${key}`;
                  }
                } else {
                  body[k] = v;
                }
              }
            } else {
              body = await request.json();
            }
            const now = (/* @__PURE__ */ new Date()).toISOString();
            let coordinates = body.coordinates ?? body.coords ?? null;
            if (typeof coordinates === "string") {
              try {
                coordinates = JSON.parse(coordinates);
              } catch {
              }
            }
            let affected_crops = body.affected_crops ?? body.affectedCrops ?? null;
            if (typeof affected_crops === "string") {
              try {
                affected_crops = JSON.parse(affected_crops);
              } catch {
              }
            }
            const data = {
              id: body.id || `alert_${Date.now()}`,
              timestamp: body.timestamp || now,
              pest_type: body.pest_type ?? body.pestType ?? null,
              severity: body.severity ?? null,
              description: body.description ?? null,
              affected_crops,
              location: body.location ?? null,
              coordinates,
              photo_name: photoName || body.photo_name || body.photoName || null,
              photo_url: photoUrl || body.photo_url || null
            };
            await db.prepare(
              `INSERT INTO alerts (
            id, timestamp, pest_type, severity, description,
            affected_crops, location, coordinates, photo_name, photo_url,
            account_id, user_id, created_at, created_by, updated_at, updated_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              data.id,
              data.timestamp,
              data.pest_type,
              data.severity,
              data.description,
              data.affected_crops != null ? JSON.stringify(data.affected_crops) : null,
              data.location,
              data.coordinates != null ? JSON.stringify(data.coordinates) : null,
              data.photo_name,
              data.photo_url,
              accountId,
              userId,
              now,
              userId,
              now,
              userId
            ).run();
            return json({ success: true, id: data.id }, 201);
          } catch (err) {
            console.error("[/alerts POST] error:", err && err.stack ? err.stack : err);
            return json({ error: err?.message || String(err) }, 500);
          }
        }
        return json({ error: "Method not allowed" }, 405);
      }
      if (pathname.startsWith("/diagnosis")) {
        if (request.method === "GET") {
          const { results } = await db.prepare(
            "SELECT * FROM v_diagnosis_active WHERE account_id = ? AND user_id = ? ORDER BY timestamp DESC"
          ).bind(accountId, userId).all();
          return json(results.map(parseDiagnosis));
        }
        if (request.method === "POST") {
          const formData = await request.formData();
          const submissionData = {};
          for (const [key, value] of formData.entries()) {
            submissionData[key] = value;
          }
          const photoFile = submissionData.photo instanceof File ? submissionData.photo : null;
          let diagPhotoName = null;
          let diagPhotoUrl = null;
          if (photoFile) {
            diagPhotoName = photoFile.name || `diagnosis_${Date.now()}.jpg`;
            if (r2) {
              const key = `diagnosis/${accountId}/${userId}/${Date.now()}_${diagPhotoName}`;
              await r2.put(key, await photoFile.arrayBuffer(), { httpMetadata: { contentType: photoFile.type || "application/octet-stream" } });
              if (PUBLIC_R2_BASE_URL) diagPhotoUrl = `${PUBLIC_R2_BASE_URL}/${key}`;
            }
          }
          const mockAiResult = {
            diagnosis: {
              label: "Bercak Daun (dari Server D1)",
              confidence: 92.3,
              severity: "sedang",
              description: "Disimpan permanen di D1."
            },
            recommendations: [
              {
                id: "rec_d1_1",
                title: "Rekomendasi Server 1",
                description: "Deskripsi 1.",
                priority: "tinggi",
                timeframe: "1-2 hari"
              }
            ]
          };
          const id = `diag_${Date.now()}`;
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await db.prepare(
            `INSERT INTO diagnosis (
                id, timestamp, field_id, crop_type, latitude, longitude, notes,
                photo_name, photo_url, result_label, result_confidence, result_severity, result_description,
                recommendations, account_id, user_id, created_at, created_by, updated_at, updated_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            id,
            submissionData.timestamp || now,
            submissionData.field_id,
            submissionData.crop_type,
            submissionData.latitude,
            submissionData.longitude,
            submissionData.notes,
            diagPhotoName,
            diagPhotoUrl,
            mockAiResult.diagnosis.label,
            mockAiResult.diagnosis.confidence,
            mockAiResult.diagnosis.severity,
            mockAiResult.diagnosis.description,
            JSON.stringify(mockAiResult.recommendations),
            accountId,
            userId,
            now,
            userId,
            now,
            userId
          ).run();
          return json({ success: true, ...mockAiResult }, 201);
        }
      }
      if (pathname.startsWith("/events")) {
        const url = new URL(request.url);
        const id = pathname.split("/")[2];
        if (request.method === "GET" && !id) {
          const from = url.searchParams.get("from");
          const to = url.searchParams.get("to");
          let sql = "SELECT * FROM v_events_active WHERE account_id = ? AND user_id = ?";
          const binds = [accountId, userId];
          if (from) {
            sql += " AND start_at >= ?";
            binds.push(from);
          }
          if (to) {
            sql += " AND start_at < ?";
            binds.push(to);
          }
          sql += " ORDER BY start_at ASC";
          const { results } = await db.prepare(sql).bind(...binds).all();
          return json(results.map(parseEvent));
        }
        if (request.method === "POST" && !id) {
          const body = await request.json();
          validateRequired(body, ["id", "title", "start_at"]);
          const now = (/* @__PURE__ */ new Date()).toISOString();
          await db.prepare(
            `INSERT INTO events (
          id, title, type, crop, location, notes, start_at,
          status, source_type, source_id, account_id, user_id,
          created_at, created_by, updated_at, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            body.id,
            body.title,
            body.type,
            body.crop,
            body.location,
            JSON.stringify(body.notes || []),
            body.start_at,
            "pending",
            body.source_type,
            body.source_id,
            accountId,
            userId,
            now,
            userId,
            now,
            userId
          ).run();
          return json({ success: true, id: body.id }, 201);
        }
        if (request.method === "PATCH" && id) {
          const body = await request.json();
          const nowIso = (/* @__PURE__ */ new Date()).toISOString();
          const completed_at = body.status === "completed" ? nowIso : null;
          await db.prepare(
            "UPDATE events SET status = ?, completed_at = ?, updated_by = ?, updated_at = ? WHERE id = ? AND account_id = ? AND user_id = ?"
          ).bind(body.status, completed_at, userId, nowIso, id, accountId, userId).run();
          return json({ success: true });
        }
        if (request.method === "DELETE" && id) {
          await db.prepare(
            "UPDATE events SET deleted_at = datetime('now'), updated_by = ? WHERE id = ? AND account_id = ? AND user_id = ?"
          ).bind(userId, id, accountId, userId).run();
          return new Response(null, { status: 204, headers: corsHeaders() });
        }
      }
      return json({ error: "Not Found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: err.message || "Server error" }, 500);
    }
  }
};
var getIdentity = /* @__PURE__ */ __name((request) => ({
  accountId: request.headers.get("X-Account-Id") || "demo",
  userId: request.headers.get("X-User-Id") || "demo"
}), "getIdentity");
var corsHeaders = /* @__PURE__ */ __name(() => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-account-id, x-user-id, X-Account-Id, X-User-Id",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS"
}), "corsHeaders");
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", ...corsHeaders() }
}), "json");
var validateRequired = /* @__PURE__ */ __name((obj, fields) => {
  const miss = fields.filter((f) => obj[f] === void 0 || f in obj === false || obj[f] === null);
  if (miss.length) throw new Error(`Missing required field(s): ${miss.join(", ")}`);
}, "validateRequired");
var parseMaybeJson = /* @__PURE__ */ __name((v) => {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}, "parseMaybeJson");
var parseEvent = /* @__PURE__ */ __name((event) => ({ ...event, notes: parseMaybeJson(event.notes) }), "parseEvent");
var parseDiagnosis = /* @__PURE__ */ __name((diag) => ({
  ...diag,
  notes: parseMaybeJson(diag.notes),
  recommendations: parseMaybeJson(diag.recommendations)
}), "parseDiagnosis");

// C:/Users/AiTi/AppData/Local/nvm/v20.15.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// C:/Users/AiTi/AppData/Local/nvm/v20.15.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-JKtFaP/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// C:/Users/AiTi/AppData/Local/nvm/v20.15.1/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-JKtFaP/middleware-loader.entry.ts
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
//# sourceMappingURL=index.js.map
