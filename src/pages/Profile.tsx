import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { isThisMonth, parseISO } from 'date-fns';

export const Profile: React.FC = () => {
  const { user, signOut } = useAuth();
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const fullName = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Pengguna';
  const email = user?.email || '';
  const initials = fullName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const monthTransactions = transactions.filter(tx => isThisMonth(parseISO(tx.date)));
  const monthTotal = monthTransactions.reduce((s, tx) => s + tx.amount, 0);
  const totalTransactions = transactions.length;

  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const stats = [
    { label: 'Total Transaksi', value: totalTransactions.toString(), icon: 'receipt_long' },
    { label: 'Bulan Ini', value: fmt(monthTotal), icon: 'calendar_month' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <header
        className="fixed top-0 left-0 w-full z-50 h-16 flex items-center px-4 gap-2"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)' }}
      >
        <button
          id="btn-back-profile"
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full transition-colors active:scale-95"
          style={{ color: 'var(--color-on-surface-variant)' }}
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--color-on-surface)' }}>Profil</h1>
      </header>

      <main className="pt-24 pb-10 px-5 max-w-sm mx-auto space-y-6">
        {/* Avatar & name */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-primary/30"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  color: 'white',
                }}
              >
                {initials}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >
              <span className="material-symbols-outlined text-white text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold" style={{ color: 'var(--color-on-surface)' }}>{fullName}</p>
            <p className="text-sm mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>{email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(s => (
            <div
              key={s.label}
              className="flex flex-col items-center gap-2 p-4 rounded-3xl"
              style={{ backgroundColor: 'var(--color-surface-container)' }}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
              >
                {s.icon}
              </span>
              <p className="text-base font-bold text-center" style={{ color: 'var(--color-on-surface)' }}>{s.value}</p>
              <p className="text-[11px] text-center" style={{ color: 'var(--color-on-surface-variant)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Account info */}
        <div className="rounded-3xl overflow-hidden" style={{ backgroundColor: 'var(--color-surface-container)' }}>
          <div className="px-4 py-3 flex items-center gap-3 border-b" style={{ borderColor: 'var(--color-outline-variant)' }}>
            <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
              badge
            </span>
            <div>
              <p className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Nama</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>{fullName}</p>
            </div>
          </div>
          <div className="px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-on-surface-variant)', fontVariationSettings: "'FILL' 1" }}>
              mail
            </span>
            <div>
              <p className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Email</p>
              <p className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>{email}</p>
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          id="btn-logout"
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full h-13 flex items-center justify-center gap-2 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95 py-4"
          style={{
            backgroundColor: 'rgba(var(--color-error-rgb, 211,47,47), 0.12)',
            color: 'var(--color-error, #d32f2f)',
          }}
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span>Keluar dari Akun</span>
        </button>
      </main>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ backgroundColor: 'var(--color-surface-container-high)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className="material-symbols-outlined text-[40px]"
                style={{ color: 'var(--color-error, #d32f2f)', fontVariationSettings: "'FILL' 1" }}
              >
                logout
              </span>
              <p className="font-bold text-lg" style={{ color: 'var(--color-on-surface)' }}>Keluar dari Akun?</p>
              <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>
                Kamu akan keluar dari AturAja. Data kamu tetap tersimpan di cloud.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
              >
                Batal
              </button>
              <button
                id="btn-confirm-logout"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: 'var(--color-error, #d32f2f)', color: 'white' }}
              >
                {loggingOut ? 'Keluar...' : 'Ya, Keluar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
