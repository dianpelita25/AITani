// ai-tani-kupang-api/src/index.js

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import jwt from '@tsndr/cloudflare-worker-jwt';

// Impor semua handler dari file-file terpisah
import { handleRegister, handleLogin, handleForgotPassword, handleResetPassword } from './routes/auth';
import { handlePhotoGet } from './routes/photos';
import { handleGetAlerts, handleCreateAlert, handleDeleteAlert } from './routes/alerts';
// [PERUBAHAN] Impor sekarang dari 'farm-tasks.js' (seharusnya sudah otomatis diperbarui oleh VS Code)
import { 
    handleGetEvents as handleGetFarmTasks, 
    handleCreateEvent as handleCreateFarmTask, 
    handleUpdateEvent as handleUpdateFarmTask, 
    handleDeleteEvent as handleDeleteFarmTask 
} from './routes/farm-tasks';
import { handleGetDiagnosisHistory, handleCreateDiagnosis, handleOnlineDiagnosis, handleShopAssistant } from './routes/diagnosis';
import { handleGetWeatherAdvice, handleGetWeather } from './routes/weather';
import { handleShopEstimate } from './routes/shop';
import { handleSeedAlerts, seedAlertsFromFixtures } from './routes/dev';
import { json } from './routes/utils';

const app = new Hono();

// --- Middleware ---
// ... (Middleware CORS dan auth tidak berubah) ...
app.use('*', (c, next) => {
    const env = c.env;
    const allowedOrigins = (env.ALLOWED_ORIGIN || '*').split(',').map(o => o.trim());
    return cors({
        origin: allowedOrigins,
        allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Account-Id', 'X-User-Id'],
    })(c, next);
});
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
app.post('/auth/reset-password', handleResetPassword);
app.get('/health', (c) => json({ ok: true, ts: new Date().toISOString() }, 200, c.env, c.req.raw));

// B. Route Terproteksi
app.get('/alerts', authMiddleware, handleGetAlerts);
app.post('/alerts', authMiddleware, handleCreateAlert);
app.delete('/alerts/:id', authMiddleware, handleDeleteAlert);

// [PERUBAHAN KUNCI] Mengganti rute '/events' menjadi '/farm-tasks'
app.get('/farm-tasks', authMiddleware, handleGetFarmTasks);
app.post('/farm-tasks', authMiddleware, handleCreateFarmTask);
app.patch('/farm-tasks/:id', authMiddleware, handleUpdateFarmTask);
app.delete('/farm-tasks/:id', authMiddleware, handleDeleteFarmTask);

app.get('/diagnosis', authMiddleware, handleGetDiagnosisHistory);
app.post('/diagnosis', authMiddleware, handleCreateDiagnosis);
// Online diagnosis dibuka tanpa auth untuk demo; tambahkan auth jika diperlukan
app.post('/diagnosis/online', handleOnlineDiagnosis);
app.post('/shop-assistant', handleShopAssistant);
app.post('/shop/estimate', authMiddleware, handleShopEstimate);

app.get('/photos/:key+', authMiddleware, handlePhotoGet);
app.get('/weather/advice', authMiddleware, handleGetWeatherAdvice);
app.get('/weather', handleGetWeather);

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

export { seedAlertsFromFixtures };
