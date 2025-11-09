// src/routes/auth.js

// Handler untuk registrasi
export async function handleRegister(request, env) {
  // TODO: Tambahkan logika registrasi di sini
  console.log("Menangani permintaan registrasi...");

  const responseBody = { success: true, message: 'Endpoint registrasi berfungsi.' };
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handler untuk login
export async function handleLogin(request, env) {
  // TODO: Tambahkan logika login di sini
  console.log("Menangani permintaan login...");

  const responseBody = { success: true, message: 'Endpoint login berfungsi.' };
  return new Response(JSON.stringify(responseBody), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}