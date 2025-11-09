-- MIGRATION 0007: BUAT TABEL PENGGUNA (USERS)
-- Perintah ini akan membuat tabel baru bernama 'users' untuk menyimpan
-- informasi login dan profil pengguna.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,                   -- ID unik untuk setiap pengguna (kita akan buat ini di kode nanti)
    email TEXT UNIQUE NOT NULL,                     -- Email yang akan digunakan untuk login (harus unik, tidak boleh sama)
    hashed_password TEXT NOT NULL,                  -- Ini untuk menyimpan password yang sudah dienkripsi, BUKAN password asli
    full_name TEXT,                                 -- Nama lengkap pengguna, contoh: "Bapak Yosef"
    role TEXT NOT NULL DEFAULT 'USER',              -- Peran pengguna, untuk sekarang semuanya adalah 'USER'
    account_id TEXT,                                -- ID untuk grup/organisasi jika nanti diperlukan
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,      -- Waktu kapan akun ini dibuat (otomatis terisi)
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,      -- Waktu kapan data pengguna terakhir diubah (otomatis terisi)
    last_login_at TEXT                              -- Waktu kapan pengguna terakhir kali login
);

-- Perintah ini membuat 'indeks' pada kolom email.
-- Tujuannya adalah agar proses pencarian email saat login menjadi sangat cepat.
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);