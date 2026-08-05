import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12"
      style={{ backgroundColor: 'var(--color-background)' }}
    >
      {/* Top section — branding */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-24 h-24 rounded-[32px] flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              boxShadow: '0 20px 60px rgba(var(--color-primary-rgb, 100,180,100), 0.35)',
            }}
          >
            <span
              className="material-symbols-outlined text-white"
              style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}
            >
              account_balance_wallet
            </span>
          </div>
          <div className="text-center">
            <h1
              className="text-[36px] font-black tracking-tight"
              style={{ color: 'var(--color-primary)' }}
            >
              AturAja
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-on-surface-variant)' }}>
              Catat. Analisis. Kontrol keuanganmu.
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="w-full space-y-3">
          {[
            { icon: 'receipt_long', text: 'Scan struk otomatis dengan AI' },
            { icon: 'insights', text: 'Analisis keuangan cerdas' },
            { icon: 'calendar_month', text: 'Pantau pengeluaran harian' },
          ].map(f => (
            <div
              key={f.icon}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-primary-container)' }}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ color: 'var(--color-on-primary-container)', fontVariationSettings: "'FILL' 1" }}
                >
                  {f.icon}
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                {f.text}
              </span>
              <span
                className="material-symbols-outlined ml-auto text-[18px]"
                style={{ color: 'var(--color-on-surface-variant)' }}
              >
                check_circle
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom section — login button */}
      <div className="w-full max-w-sm space-y-4">
        <button
          id="btn-google-login"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--color-surface-container-high)',
            color: 'var(--color-on-surface)',
            border: '1px solid var(--color-outline-variant)',
          }}
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin text-[22px]">progress_activity</span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span>{loading ? 'Mengarahkan...' : 'Lanjutkan dengan Google'}</span>
        </button>

        <p
          className="text-center text-xs leading-relaxed"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          Dengan masuk, kamu menyetujui{' '}
          <span style={{ color: 'var(--color-primary)' }}>Syarat & Ketentuan</span> dan{' '}
          <span style={{ color: 'var(--color-primary)' }}>Kebijakan Privasi</span> AturAja.
        </p>
      </div>
    </div>
  );
};
