-- MIGRATION 0008: BUAT TABEL PASSWORD RESET TOKENS
-- Tabel ini akan menyimpan token sekali pakai yang dikirim ke email pengguna
-- saat mereka meminta untuk mereset password.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    token TEXT PRIMARY KEY NOT NULL,    -- Token acak yang unik, ini yang akan kita taruh di URL email
    user_id TEXT NOT NULL,              -- ID pengguna yang meminta reset, terhubung ke tabel 'users'
    expires_at TEXT NOT NULL,           -- Timestamp kapan token ini akan kedaluwarsa (misal: 1 jam dari sekarang)
    used_at TEXT,                       -- Timestamp kapan token ini digunakan (awalnya NULL)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Buat index pada kolom user_id untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);