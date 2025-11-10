// ai-tani-kupang-api/src/routes/auth.js

import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

// Handler untuk registrasi
export async function handleRegister(c) {
  const request = c.req.raw;
  const env = c.env;

  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password || password.length < 6) {
      return new Response(JSON.stringify({ success: false, error: 'Email diperlukan dan password minimal 6 karakter.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare('INSERT INTO users (id, email, hashed_password, full_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(userId, email, hashedPassword, fullName || null, now, now)
      .run();

    return new Response(JSON.stringify({ success: true, userId: userId }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return new Response(JSON.stringify({ success: false, error: 'Email ini sudah terdaftar.' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }
    console.error("Registrasi gagal:", err);
    return new Response(JSON.stringify({ success: false, error: 'Registrasi gagal karena kesalahan server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Handler untuk login
export async function handleLogin(c) {
  const request = c.req.raw;
  const env = c.env;

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Email dan password diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const user = await env.DB.prepare('SELECT id, email, hashed_password, full_name, role FROM users WHERE email = ?')
      .bind(email)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'Email atau password salah.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.hashed_password);

    if (!passwordIsValid) {
      return new Response(JSON.stringify({ success: false, error: 'Email atau password salah.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
    };
    
    const token = await jwt.sign(payload, env.JWT_SECRET);
    
    const userProfile = {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    };

    return new Response(JSON.stringify({ success: true, user: userProfile, token: token }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error("Login gagal:", err);
    return new Response(JSON.stringify({ success: false, error: 'Login gagal karena kesalahan server.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

// Handler untuk Lupa Password
export async function handleForgotPassword(c) {
    const request = c.req.raw;
    const env = c.env;

    try {
        const { email } = await request.json();
        if (!email) {
            return new Response(JSON.stringify({ success: false, error: 'Email diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();

        if (!user) {
            console.log(`Permintaan reset password untuk email tidak terdaftar: ${email}`);
            return new Response(JSON.stringify({ success: true, message: 'Jika email terdaftar, instruksi reset akan dikirim.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await env.DB.prepare(
            'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (?, ?, ?)'
        ).bind(resetToken, user.id, expiresAt.toISOString()).run();

        const resetUrl = `http://localhost:4028/reset-password?token=${resetToken}`;
        
        const emailPayload = {
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Instruksi Reset Password Ai Tani Kupang',
            html: `<h1>Reset Password Anda</h1><p>Klik tautan di bawah ini untuk mereset password Anda. Tautan ini akan kedaluwarsa dalam 1 jam.</p><a href="${resetUrl}" target="_blank">Reset Password Saya</a><p>Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>`
        };

        // ====================================================================
        // === [BARIS DEBUGGING] - Tampilkan kunci API yang digunakan ===
        // ====================================================================
        console.log("Mencoba mengirim email. Menggunakan Resend API Key:", env.RESEND_API_KEY);
        // ====================================================================
        
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        if (!resendResponse.ok) {
            const errorBody = await resendResponse.json();
            console.error("Gagal mengirim email via Resend:", errorBody);
            throw new Error('Gagal mengirim email instruksi.');
        }

        console.log(`Email reset password berhasil dikirim ke: ${email}`);
        return new Response(JSON.stringify({ success: true, message: 'Jika email terdaftar, instruksi reset akan dikirim.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error("Forgot Password Gagal:", err);
        return new Response(JSON.stringify({ success: false, error: 'Gagal memproses permintaan.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}