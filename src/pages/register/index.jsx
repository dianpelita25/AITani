// src/pages/register/index.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
// BARU: Impor hook registrasi
import { useRegisterMutation } from '../../services/authApi';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // BARU: Panggil hook useRegisterMutation
  const [register, { isLoading }] = useRegisterMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
        setError('Password minimal harus 6 karakter.');
        return;
    }

    try {
      // BARU: Panggil fungsi 'register' dengan data dari form
      await register({ fullName, email, password }).unwrap();
      
      // Jika berhasil, beri tahu pengguna dan arahkan ke halaman login
      alert('Registrasi berhasil! Silakan masuk dengan akun baru Anda.');
      navigate('/login');

    } catch (err) {
      // BARU: Tangani error dari API
      const errorMessage = err.data?.error || 'Terjadi kesalahan saat registrasi.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Icon name="Leaf" size={48} className="text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground">Buat Akun Baru</h1>
          <p className="text-muted-foreground">Bergabunglah dengan komunitas AI Tani Kupang.</p>
        </div>

        <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nama Lengkap" id="fullName" type="text" placeholder="Contoh: Bapak Yosef"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              required disabled={isLoading}
            />
            <Input
              label="Alamat Email" id="email" type="email" placeholder="contoh@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required disabled={isLoading}
            />
            <Input
              label="Password" id="password" type="password" placeholder="Minimal 6 karakter"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required disabled={isLoading}
            />

            {error && (
              <div className="text-sm text-center text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit" fullWidth loading={isLoading} iconName="UserPlus" iconPosition="left"
              disabled={isLoading}
            >
              {isLoading ? 'Mendaftarkan...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Sudah punya akun?{' '}
              <span onClick={() => navigate('/login')} className="font-semibold text-primary hover:underline cursor-pointer">
                Masuk di sini
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;