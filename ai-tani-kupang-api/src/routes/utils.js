// ai-tani-kupang-api/src/routes/utils.js - VERSI FINAL DIPERKETAT

// Fungsi ini SEKARANG akan mengambil identitas HANYA dari token JWT yang sudah diverifikasi.
// Tidak ada lagi fallback ke 'demo'.
export const getIdentity = (c) => {
    const user = c.get('jwtPayload'); // 'jwtPayload' diisi oleh authMiddleware
    
    // Jika karena alasan tertentu payload tidak ada (misalnya middleware lupa dijalankan),
    // kita akan melempar error agar tidak terjadi kebocoran data.
    if (!user || !user.userId) {
        throw new Error('Identitas pengguna tidak ditemukan di dalam token.');
    }

    return {
        // Kita bisa definisikan accountId di masa depan jika diperlukan
        accountId: user.accountId || user.userId, // Untuk saat ini, accountId = userId
        userId: user.userId,
    };
};


// ====================================================================
// SEMUA FUNGSI HELPER LAINNYA DI BAWAH INI TETAP SAMA PERSIS
// ====================================================================

export const parseMaybeJson = (v) => { try { return JSON.parse(v); } catch { return v; } };

const pickAllowedOrigin = (env, request) => {
    const configured = (env.ALLOWED_ORIGIN || "*").trim();
    const reqOrigin = request.headers.get("Origin") || "";
    if (configured === "*") return "*";
    const list = configured.split(",").map(s => s.trim()).filter(Boolean);
    if (reqOrigin && list.includes(reqOrigin)) return reqOrigin;
    return list[0] || "*";
};

export const corsHeaders = (env, request) => ({
    "Access-Control-Allow-Origin": pickAllowedOrigin(env, request),
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "content-type, x-account-id, x-user-id, X-Account-Id, X-User-Id, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
});

export const json = (data, status = 200, env, request, extra = {}) =>
    new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...corsHeaders(env, request), ...extra },
    });

export function buildPhotoUrl(request, env, key) {
    const reqUrl = new URL(request.url);
    const isLocal = ["127.0.0.1", "localhost"].includes(reqUrl.hostname);
    const bucket = env.R2_BUCKET || "aitaniweb-photos";
    const localBase = (env.R2_LOCAL_BASE || `http://127.0.0.1:8787/r2`).replace(/\/+$/, "");
    const publicBase = (env.PUBLIC_R2_BASE_URL || "").replace(/\/+$/, "");
    if (isLocal) {
        return `${localBase}/${bucket}/${encodeURI(key)}`;
    }
    if (!publicBase) return null;
    return `${publicBase}/${encodeURI(key)}`;
}

export function guessContentType(filename = "") {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".gif")) return "image/gif";
    return "image/jpeg";
}

export function sanitizeFileName(name = "") {
    const base = name.split("/").pop().split("\\").pop();
    return base.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "-");
}