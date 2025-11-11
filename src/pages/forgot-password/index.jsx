// src/pages/forgot-password/index.jsx - VERSI DIPERBAIKI

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useForgotPasswordMutation } from '../../services/authApi';

const ForgotPasswordPage = () => {
    const [email, setEmail] = React.useState('');
    const [error, setError] = React.useState(null);
    const [isSuccess, setIsSuccess] = React.useState(false);
    // Kita tidak lagi butuh isLoading manual karena RTK Query akan menanganinya
    // const [isLoading, setIsLoading] = React.useState(false); // INI DIHAPUS

    const navigate = useNavigate();

    const [forgotPassword, { isLoading }] = useForgotPasswordMutation(); // isLoading didapat dari sini

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setIsLoading(true); // Tidak perlu lagi
        setError(null);
        
        try {
            await forgotPassword({ email }).unwrap();
            setIsSuccess(true);
        } catch (err) {
            setError("Terjadi kesalahan. Silakan coba lagi nanti.");
        } 
        // finally { setIsLoading(false); } // Tidak perlu lagi
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Icon name="MailQuestion" size={48} className="text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-foreground">Lupa Password</h1>
                    <p className="text-muted-foreground">
                        {isSuccess 
                            ? "Silakan periksa email Anda untuk instruksi selanjutnya."
                            : "Masukkan email Anda untuk menerima tautan reset password."
                        }
                    </p>
                </div>

                <div className="bg-card p-8 rounded-2xl border border-border shadow-lg">
                    {isSuccess ? (
                        <div className="text-center">
                            <p className="text-foreground mb-6">
                                Jika email yang Anda masukkan terdaftar, tautan telah dikirimkan.
                            </p>
                            <Button
                                fullWidth
                                onClick={() => navigate('/login')}
                                iconName="ArrowLeft"
                                iconPosition="left"
                            >
                                Kembali ke Login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Alamat Email" id="email" type="email"
                                placeholder="contoh@email.com"
                                value={email} onChange={(e) => setEmail(e.target.value)}
                                required disabled={isLoading}
                            />
                            {error && <div className="text-sm text-destructive">{error}</div>}
                            <Button type="submit" fullWidth loading={isLoading} iconName="Send" iconPosition="left">
                                {isLoading ? 'Mengirim...' : 'Kirim Instruksi'}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;