// src/pages/reset-password/index.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useResetPasswordMutation } from '../../services/authApi';

const ResetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const token = searchParams.get('token');

    const [resetPassword, { isLoading }] = useResetPasswordMutation();

    useEffect(() => {
        if (!token) {
            setError("Token reset tidak valid atau tidak ditemukan. Silakan coba minta reset lagi.");
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError("Password dan konfirmasi password tidak cocok.");
            return;
        }
        if (password.length < 6) {
            setError("Password minimal harus 6 karakter.");
            return;
        }
        if (!token) {
            setError("Token tidak ditemukan. Proses reset tidak dapat dilanjutkan.");
            return;
        }
        
        setError(null);

        try {
            await resetPassword({ token, password }).unwrap();
            setIsSuccess(true);
            
        } catch (err) {
            const errorMessage = err.data?.error || "Gagal mengatur password. Token mungkin sudah kedaluwarsa atau tidak valid.";
            setError(errorMessage);
        }
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
                            {error && <div className="text-sm text-center text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
                            
                            <Input
                                label="Password Baru" id="password" type="password"
                                placeholder="Minimal 6 karakter"
                                value={password} onChange={(e) => setPassword(e.target.value)}
                                required disabled={!token || isLoading}
                                autoComplete="new-password"
                            />
                            <Input
                                label="Konfirmasi Password Baru" id="confirmPassword" type="password"
                                placeholder="Ulangi password baru Anda"
                                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                required disabled={!token || isLoading}
                                autoComplete="new-password"
                            />

                            {/* [PERBAIKAN BUG] Nonaktifkan spinner sementara untuk menghindari error rendering SVG.
                                Teks 'Menyimpan...' sudah cukup sebagai umpan balik. */}
                            <Button type="submit" fullWidth loading={false} disabled={!token || isLoading} iconName="Save" iconPosition="left">
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