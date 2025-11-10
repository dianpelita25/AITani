// src/pages/login/index.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux'; // <-- 1. Impor useDispatch
import { setCredentials } from '../../services/authSlice'; // <-- 2. Impor "instruksi" kita
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useLoginMutation } from '../../services/authApi'; 

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch(); // <-- 3. Siapkan alat untuk "menekan tombol"

  const [login, { isLoading }] = useLoginMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login({ email, password }).unwrap();
      
      // 4. SETELAH LOGIN BERHASIL, "TEKAN TOMBOL" setCredentials
      // Kirim data user dan token yang kita dapat dari API.
      dispatch(setCredentials({ user: result.user, token: result.token }));
      
      // Arahkan pengguna ke halaman utama
      navigate('/home-dashboard');

    } catch (err) {
      const errorMessage = err.data?.error || 'Terjadi kesalahan. Silakan coba lagi.';
      setError(errorMessage);
    }
  };

  // ... (sisa kode JSX untuk tampilan form tetap sama persis)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Icon name="Leaf" size={48} className="text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Selamat Datang Kembali</h1>
          <p className="text-muted-foreground">Silakan masuk ke akun AI Tani Kupang Anda.</p>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Alamat Email" id="email" type="email" placeholder="contoh@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required disabled={isLoading}
            />
            <Input
              label="Password" id="password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required disabled={isLoading}
            />

            {error && (
              <div className="text-sm text-center text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth loading={isLoading} iconName="LogIn" iconPosition="left" disabled={isLoading}>
              {isLoading ? 'Memverifikasi...' : 'Masuk'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <span onClick={() => navigate('/register')} className="font-semibold text-primary hover:underline cursor-pointer">
                Daftar di sini
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;