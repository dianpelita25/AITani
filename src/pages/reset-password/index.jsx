// src/pages/reset-password/index.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
// TODO: Impor useResetPasswordMutation

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Ambil token dari URL (?token=...)
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError("Token reset tidak valid atau tidak ditemukan. Silakan coba minta reset lagi.");
        }
    }, [token]);


    // TODO: Ganti dengan logika API
    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Password dan konfirmasi password tidak cocok.");
            return;
        }
        if (password.length < 6) {
            setError("Password minimal harus 6 karakter.");
            return;
        }
        setError(null);
        setIsLoading(true);

        console.log("Mencoba reset password dengan token:", token);
        console.log("Password baru:", password);

        // Simulasi sukses
        setTimeout(() => {
            setIsLoading(false);
            setIsSuccess(true);
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Icon name="KeyRound" size={48} className="text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-foreground">Atur Password Baru</h1>
                     <p className="text-muted-foreground">
                        {isSuccess ? "Password Anda telah berhasil diperbarui." : "Masukkan password baru Anda di bawah ini."}
                    </p>
                </div>

                <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
                    {isSuccess ? (
                        <div className="text-center">
                            <p className="text-foreground mb-6">
                                Anda sekarang dapat masuk dengan menggunakan password baru Anda.
                            </p>
                            <Button
                                fullWidth
                                onClick={() => navigate('/login')}
                                iconName="LogIn"
                                iconPosition="left"
                            >
                                Lanjutkan ke Halaman Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Password Baru" id="password" type="password"
                                placeholder="Minimal 6 karakter"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                required disabled={!token || isLoading}
                            />
                            <Input
                                label="Konfirmasi Password Baru" id="confirmPassword" type="password"
                                placeholder="Ulangi password baru Anda"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                required disabled={!token || isLoading}
                            />

                            {error && <div className="text-sm text-center text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

                            <Button type="submit" fullWidth loading={isLoading} disabled={!token || isLoading}>
                                {isLoading ? 'Menyimpan...' : 'Simpan Password Baru'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;