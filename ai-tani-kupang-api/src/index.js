// ai-tani-kupang-api/src/index.js

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jwt from '@tsndr/cloudflare-worker-jwt';

// Impor semua handler dari file-file terpisah
import { handleRegister, handleLogin, handleForgotPassword, handleResetPassword } from './routes/auth';
import { handlePhotoGet } from './routes/photos';
import { handleGetAlerts, handleCreateAlert, handleDeleteAlert } from './routes/alerts';
import { handleGetEvents, handleCreateEvent, handleUpdateEvent, handleDeleteEvent } from './routes/events';
import { handleGetDiagnosisHistory, handleCreateDiagnosis } from './routes/diagnosis';
import { handleGetWeatherAdvice } from './routes/weather';
import { handleSeedAlerts } from './routes/dev';
import { json } from './routes/utils';

const app = new Hono();

// --- Middleware ---

// 1. Middleware CORS (berjalan untuk semua permintaan)
app.use('*', (c, next) => {
    const env = c.env;
    const allowedOrigins = (env.ALLOWED_ORIGIN || '*').split(',').map(o => o.trim());
    return cors({
        origin: allowedOrigins,
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Account-Id', 'X-User-Id'],
    })(c, next);
});

// 2. Middleware Autentikasi ("Penjaga Pintu")
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    const isValid = await jwt.verify(token, c.env.JWT_SECRET);
    if (!isValid) { return c.json({ error: 'Unauthorized: Invalid token' }, 401); }
    const payload = jwt.decode(token).payload;
    c.set('jwtPayload', payload);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized: Token verification failed' }, 401);
  }
};

// --- Definisi Routes ---

// A. Route Publik
app.post('/auth/register', handleRegister);
app.post('/auth/login', handleLogin);
app.post('/auth/forgot-password', handleForgotPassword);
app.post('/auth/reset-password', handleResetPassword); // <-- Route Baru
app.get('/health', (c) => json({ ok: true, ts: new Date().toISOString() }, 200, c.env, c.req.raw));

// B. Route Terproteksi
app.get('/alerts', authMiddleware, handleGetAlerts);
app.post('/alerts', authMiddleware, handleCreateAlert);
app.delete('/alerts/:id', authMiddleware, handleDeleteAlert);

app.get('/events', authMiddleware, handleGetEvents);
app.post('/events', authMiddleware, handleCreateEvent);
app.patch('/events/:id', authMiddleware, handleUpdateEvent);
app.delete('/events/:id', authMiddleware, handleDeleteEvent);

app.get('/diagnosis', authMiddleware, handleGetDiagnosisHistory);
app.post('/diagnosis', authMiddleware, handleCreateDiagnosis);

app.get('/photos/:key+', authMiddleware, handlePhotoGet);
app.get('/weather/advice', authMiddleware, handleGetWeatherAdvice);

// C. Route Khusus Development
app.post('/dev/seed-alerts', handleSeedAlerts);

app.notFound((c) => c.json({ error: 'Not Found', path: c.req.path }, 404));


// --- Helper untuk Fungsi Terjadwal (Cron) ---
async function getWeatherAdviceBMKG(lat, lon) {
    const resp = await fetch(`https://ibnux.github.io/BMKG-importer/cuaca/501190.json`);
    if (!resp.ok) throw new Error(`BMKG status ${resp.status}`);
    const list = await resp.json();
    const willRain = list.some((x) => /hujan/i.test(x.cuaca || ''));
    return { summary: willRain ? 'Berpotensi hujan' : 'Cerah/berawan' };
}

// --- Handler Utama Worker ---
export default {
    // Handler untuk permintaan HTTP
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/api/')) {
            const newPath = url.pathname.slice(4);
            const modifiedUrl = new URL(newPath, request.url);
            const modifiedRequest = new Request(modifiedUrl, request);
            return app.fetch(modifiedRequest, env, ctx);
        }
        return app.fetch(request, env, ctx);
    },

    // Handler untuk tugas terjadwal (Cron)
    async scheduled(controller, env, ctx) {
        console.log("Cron job is running...");
        try {
            const lat = -10.177;
            const lon = 123.607;
            const payload = await getWeatherAdviceBMKG(lat, lon);
            
            if (env.KV) {
                await env.KV.put('notif:demo', JSON.stringify({ ts: new Date().toISOString(), advice: payload }));
                console.log("Cron job: Successfully fetched and cached weather data.");
            }
        } catch (e) {
            console.error('Cron job failed:', e.message || e);
        }
    }
};