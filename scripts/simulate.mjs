// Simulasi end-to-end tanpa UI terhadap Worker yang sudah dideploy
// Node 18+ required (global fetch/FormData/Blob/File available)

const API_BASE = process.env.API || 'https://ai-tani-kupang-api.olif-tf.workers.dev';
const headers = {
  'X-Account-Id': process.env.ACCOUNT_ID || 'demo',
  'X-User-Id': process.env.USER_ID || 'demo',
};

function logSection(title) {
  console.log(`\n=== ${title} ===`);
}

function b64ToUint8Array(b64) {
  const bin = Buffer.from(b64, 'base64');
  return new Uint8Array(bin);
}

async function simulateAlerts() {
  logSection('Alerts: create + list');

  // 1x1 PNG
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  const file = new File([b64ToUint8Array(b64)], 'tiny.png', { type: 'image/png' });

  const fd = new FormData();
  fd.set('pestType', 'wereng');
  fd.set('severity', 'sedang');
  fd.set('description', 'Simulasi upload via skrip');
  fd.set('location', '-10.1,123.6');
  fd.set('coordinates', JSON.stringify({ lat: -10.1, lng: 123.6 }));
  fd.set('timestamp', new Date().toISOString());
  fd.set('photo', file, file.name);

  const res = await fetch(`${API_BASE}/api/alerts`, { method: 'POST', headers, body: fd });
  const body = await res.json().catch(() => ({}));
  console.log('POST /alerts ->', res.status, body);
  if (!res.ok) throw new Error('Create alert failed');

  const list = await fetch(`${API_BASE}/api/alerts`, { headers });
  const alerts = await list.json();
  const last = alerts[0];
  console.log('GET /alerts ->', list.status, 'count:', alerts.length, 'last.photo_url:', last?.photo_url || last?.photoUrl);
}

async function simulateEvents() {
  logSection('Events: create + list + patch + delete');
  const id = `plan_${Date.now()}`;
  const payload = {
    id,
    title: 'Rencana Semprot (Simulasi)',
    type: 'semprot',
    crop: 'padi',
    location: 'Lahan Utama',
    notes: ['Dibuat oleh skrip simulasi'],
    start_at: new Date().toISOString(),
    source_type: null,
    source_id: null,
  };
  const create = await fetch(`${API_BASE}/api/events`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const createText = await create.text();
  console.log('POST /events ->', create.status, createText || '');
  if (!create.ok) throw new Error('Create event failed');

  const list = await fetch(`${API_BASE}/api/events`, { headers });
  console.log('GET /events ->', list.status);

  const patch = await fetch(`${API_BASE}/api/events/${id}`, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'completed' }),
  });
  console.log('PATCH /events/:id ->', patch.status);

  const del = await fetch(`${API_BASE}/api/events/${id}`, { method: 'DELETE', headers });
  console.log('DELETE /events/:id ->', del.status);
}

async function simulateDiagnosis() {
  logSection('Diagnosis: create + list');
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
  const file = new File([b64ToUint8Array(b64)], 'leaf.png', { type: 'image/png' });

  const fd = new FormData();
  fd.set('field_id', 'LAHAN-001');
  fd.set('crop_type', 'padi');
  fd.set('latitude', '-10.1');
  fd.set('longitude', '123.6');
  fd.set('notes', 'Simulasi');
  fd.set('photo', file, file.name);

  const res = await fetch(`${API_BASE}/api/diagnosis`, { method: 'POST', headers, body: fd });
  const body = await res.json().catch(() => ({}));
  console.log('POST /diagnosis ->', res.status, body?.success);
  if (!res.ok) throw new Error('Create diagnosis failed');

  const list = await fetch(`${API_BASE}/api/diagnosis`, { headers });
  const items = await list.json();
  const last = items[0];
  console.log('GET /diagnosis ->', list.status, 'count:', items.length, 'last.photo_url:', last?.photo_url);
}

async function main() {
  try {
    await simulateAlerts();
    await simulateEvents();
    await simulateDiagnosis();
    console.log('\nAll simulations completed successfully.');
  } catch (e) {
    console.error('Simulation failed:', e);
    process.exitCode = 1;
  }
}

main();
