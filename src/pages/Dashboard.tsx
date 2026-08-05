import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { useAuth } from '../context/AuthContext';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import type { AIInsightData } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../types';

// Gunakan URL absolut untuk APK Android, fallback ke relative path untuk dev
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

const MONTHLY_BUDGET = 6_500_000;

function CategoryIcon({ category, size = 20 }: { category: string; size?: number }) {
  const icon = CATEGORY_ICONS[category] ?? 'category';
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-surface-container text-on-surface-variant';
  return (
    <div className={`w-11 h-11 flex items-center justify-center rounded-[20px] shrink-0 ${colorClass}`}>
      <span className="material-symbols-outlined" style={{ fontSize: size, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    </div>
  );
}

export const Dashboard: React.FC = () => {
  const { transactions, loading } = useTransactions();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [aiInsight, setAiInsight] = useState<AIInsightData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const todayTransactions = useMemo(() =>
    transactions.filter(tx => isToday(parseISO(tx.date))), [transactions]);

  const weekTransactions = useMemo(() =>
    transactions.filter(tx => isThisWeek(parseISO(tx.date))), [transactions]);

  const monthTransactions = useMemo(() =>
    transactions.filter(tx => isThisMonth(parseISO(tx.date))), [transactions]);

  const todayTotal = useMemo(() =>
    todayTransactions.reduce((sum, tx) => sum + tx.amount, 0), [todayTransactions]);

  const weekTotal = useMemo(() =>
    weekTransactions.reduce((sum, tx) => sum + tx.amount, 0), [weekTransactions]);

  const monthTotal = useMemo(() =>
    monthTransactions.reduce((sum, tx) => sum + tx.amount, 0), [monthTransactions]);

  const topCategory = useMemo(() => {
    if (todayTransactions.length === 0) return null;
    const counts = todayTransactions.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [todayTransactions]);

  const topMerchant = useMemo(() => {
    if (todayTransactions.length === 0) return null;
    const counts = todayTransactions.reduce((acc, tx) => {
      acc[tx.merchant] = (acc[tx.merchant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [todayTransactions]);

  const budgetPct = Math.min(100, Math.round((monthTotal / MONTHLY_BUDGET) * 100));
  const budgetRemaining = MONTHLY_BUDGET - monthTotal;

  const fetchInsights = useCallback(async () => {
    if (transactions.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch(`${API_BASE}/.netlify/functions/ai-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: transactions.slice(0, 100) }),
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const e = await res.json(); detail = e?.error || e?.details || detail; } catch { /* ignore */ }
        throw new Error(detail);
      }
      const data: AIInsightData = await res.json();
      setAiInsight(data);
      setAiError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal terhubung ke AI';
      setAiError(msg);
    } finally {
      setAiLoading(false);
    }
  }, [transactions]);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const firstName = ((user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Pengguna').split(' ')[0];
  const initials = ((user?.user_metadata?.full_name as string) || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* TopAppBar */}
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex justify-between items-center px-5"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-3">
          {/* Profile button */}
          <button
            id="btn-profile"
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center transition-all active:scale-90 hover:ring-2 hover:ring-primary/40"
            style={{ backgroundColor: 'var(--color-primary-container)' }}
            aria-label="Buka Profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span
                className="text-[13px] font-bold"
                style={{ color: 'var(--color-on-primary-container)' }}
              >
                {initials}
              </span>
            )}
          </button>
          <div>
            <p className="text-[11px]" style={{ color: 'var(--color-on-surface-variant)' }}>Halo,</p>
            <h1 className="text-[16px] font-bold leading-tight" style={{ color: 'var(--color-primary)' }}>{firstName} 👋</h1>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors active:scale-95">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
        </button>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto space-y-7">

        {/* ── Daily Pulse Card ── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h2 className="text-[15px] font-semibold text-primary">Daily Pulse</h2>
          </div>

          <div
            className="p-6 rounded-[24px] relative overflow-hidden shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-primary-container) 0%, #2d4a25 100%)' }}
          >
            <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[12px] font-medium text-white/70 mb-1">Today's Spending</p>
                  <h3 className="text-[30px] font-bold tracking-tight text-white leading-none">
                    Rp{todayTotal.toLocaleString('id-ID')}
                  </h3>
                  <p className="text-[12px] text-white/60 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                    {todayTransactions.length} transaksi hari ini
                  </p>
                </div>
                <div className="bg-white/15 p-2.5 rounded-2xl">
                  <span className="material-symbols-outlined text-white text-[22px]">trending_up</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-[10px] text-white/60 mb-0.5">Kategori Terbesar</p>
                  <p className="text-[13px] font-semibold text-white">{topCategory ?? '—'}</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-3">
                  <p className="text-[10px] text-white/60 mb-0.5">Merchant Favorit</p>
                  <p className="text-[13px] font-semibold text-white truncate">{topMerchant ?? '—'}</p>
                </div>
              </div>

              {/* AI Tip */}
              <div className="bg-white/10 border border-white/10 p-3 rounded-2xl flex items-start gap-2">
                <span className="material-symbols-outlined text-white text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                <p className="text-[12px] text-white/85">
                  {aiInsight?.analysis
                    ? aiInsight.analysis.slice(0, 120) + (aiInsight.analysis.length > 120 ? '...' : '')
                    : todayTransactions.length === 0
                    ? 'Belum ada transaksi hari ini. Yuk mulai catat pengeluaranmu!'
                    : `Pengeluaran terbesar hari ini: kategori ${topCategory}.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Summary Cards (3-col) ── */}
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>Ringkasan</h2>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Hari ini', value: todayTotal, count: todayTransactions.length },
              { label: 'Minggu ini', value: weekTotal, count: weekTransactions.length },
              { label: 'Bulan ini', value: monthTotal, count: monthTransactions.length },
            ].map(item => (
              <div
                key={item.label}
                className="rounded-[16px] p-3.5 border border-outline/5 shadow-sm"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
              >
                <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--color-outline)' }}>{item.label}</p>
                <p className="text-[14px] font-bold leading-tight" style={{ color: 'var(--color-primary)' }}>
                  Rp{(item.value / 1000).toFixed(0)}k
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--color-outline)' }}>{item.count} transaksi</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Monthly Progress ── */}
        <section
          className="rounded-[20px] p-5 border border-outline/5 shadow-sm"
          style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
        >
          <p className="text-[12px] font-medium mb-1" style={{ color: 'var(--color-outline)' }}>Bulan Ini</p>
          <div className="flex items-end justify-between mb-3">
            <span className="text-[22px] font-bold" style={{ color: 'var(--color-on-surface)' }}>
              Rp{monthTotal.toLocaleString('id-ID')}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--color-outline)' }}>
              Budget <span className="font-semibold" style={{ color: 'var(--color-on-surface)' }}>Rp{MONTHLY_BUDGET.toLocaleString('id-ID')}</span>
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${budgetPct}%`,
                backgroundColor: budgetPct >= 90 ? 'var(--color-error)' : budgetPct >= 70 ? '#d97706' : 'var(--color-primary)'
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[11px]" style={{ color: 'var(--color-outline)' }}>{budgetPct}% terpakai</span>
            <span
              className="text-[11px] font-medium"
              style={{ color: budgetRemaining < 0 ? 'var(--color-error)' : 'var(--color-primary)' }}
            >
              {budgetRemaining < 0
                ? `Melebihi budget Rp${Math.abs(budgetRemaining).toLocaleString('id-ID')}`
                : `Rp${budgetRemaining.toLocaleString('id-ID')} tersisa`}
            </span>
          </div>
        </section>

        {/* ── AI Financial Insight ── */}
        {transactions.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>AI Financial Check</h2>
                {aiLoading && (
                  <span className="text-[11px] font-medium animate-ai-pulse" style={{ color: 'var(--color-outline)' }}>Menganalisis...</span>
                )}
              </div>
              {/* Tombol refresh selalu terlihat */}
              {!aiLoading && (
                <button
                  onClick={fetchInsights}
                  className="flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors active:scale-95"
                  style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-primary)' }}
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  {aiInsight ? 'Perbarui' : 'Analisis'}
                </button>
              )}
            </div>

            {aiLoading ? (
              /* Shimmer skeleton */
              <div className="rounded-[20px] p-5 space-y-3 border border-outline/5" style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}>
                <div className="h-3 rounded-full animate-shimmer w-3/4" />
                <div className="h-3 rounded-full animate-shimmer w-full" />
                <div className="h-3 rounded-full animate-shimmer w-5/6" />
                <div className="h-3 rounded-full animate-shimmer w-2/3" />
              </div>
            ) : aiError ? (
              /* Error state — tampilkan ke user */
              <div
                className="rounded-[20px] p-4 border space-y-3"
                style={{ backgroundColor: 'var(--color-error-container)', borderColor: 'var(--color-error)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-error)' }}>error_outline</span>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--color-on-error-container)' }}>AI Check gagal</p>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-on-error-container)', opacity: 0.8 }}>
                  {aiError.includes('fetch') || aiError.includes('Failed') || aiError.includes('NetworkError')
                    ? 'Tidak dapat terhubung ke server AI. Pastikan ada koneksi internet dan coba lagi.'
                    : aiError}
                </p>
                <button
                  onClick={fetchInsights}
                  className="flex items-center gap-1 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                  style={{ backgroundColor: 'var(--color-error)', color: 'white' }}
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span>
                  Coba Lagi
                </button>
              </div>
            ) : aiInsight ? (
              <div
                className="rounded-[20px] p-5 border shadow-sm space-y-4 animate-slide-up"
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderColor: 'rgba(74,103,65,0.2)',
                }}
              >
                {/* Analysis text */}
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {aiInsight.analysis}
                </p>

                {/* Recommendations */}
                {aiInsight.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>Rekomendasi</p>
                    {aiInsight.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'var(--color-primary-fixed)' }}>
                          <span className="text-[10px] font-bold" style={{ color: 'var(--color-on-primary-fixed)' }}>{i + 1}</span>
                        </div>
                        <p className="text-[12px] leading-relaxed flex-1" style={{ color: 'var(--color-on-surface-variant)' }}>{rec}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Estimated monthly expense */}
                {aiInsight.estimatedMonthlyExpense && (
                  <div
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ backgroundColor: 'var(--color-primary-fixed)' }}
                  >
                    <p className="text-[12px] font-medium" style={{ color: 'var(--color-on-primary-fixed)' }}>Estimasi bulan ini</p>
                    <p className="text-[13px] font-bold" style={{ color: 'var(--color-on-primary-fixed)' }}>
                      Rp{aiInsight.estimatedMonthlyExpense.toLocaleString('id-ID')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Belum ada insight — tampilkan prompt untuk mulai */
              <div
                className="rounded-[20px] p-5 border border-dashed text-center space-y-2"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}
              >
                <span className="material-symbols-outlined text-[32px] block" style={{ color: 'var(--color-outline)', fontVariationSettings: "'FILL' 1" }}>psychology</span>
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-on-surface)' }}>Analisis Keuangan AI</p>
                <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>Ketuk tombol "Analisis" untuk mendapatkan insight pengeluaranmu</p>
              </div>
            )}
          </section>
        )}

        {/* ── Recent Transactions ── */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-[15px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>Transaksi Terakhir</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-[13px] font-medium transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl border border-outline/5 animate-pulse" style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}>
                  <div className="w-11 h-11 rounded-[20px] animate-shimmer" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full animate-shimmer w-2/3" />
                    <div className="h-2.5 rounded-full animate-shimmer w-1/3" />
                  </div>
                  <div className="h-3 rounded-full animate-shimmer w-16" />
                </div>
              ))
            ) : transactions.length > 0 ? (
              transactions.slice(0, 5).map(tx => (
                <button
                  key={tx.id}
                  onClick={() => navigate(`/history/${tx.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border border-outline/5 shadow-sm transition-all active:scale-[0.98] text-left"
                  style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
                >
                  <CategoryIcon category={tx.category} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-semibold truncate" style={{ color: 'var(--color-on-surface)' }}>{tx.merchant}</h4>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        tx.source === 'AI'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tx.source === 'AI' ? '🤖 AI' : '📝 Manual'}
                      </span>
                    </div>
                    <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--color-outline)' }}>
                      {tx.category} • {tx.time}
                    </p>
                  </div>
                  <p className="text-[14px] font-semibold shrink-0" style={{ color: 'var(--color-on-surface)' }}>
                    Rp{tx.amount.toLocaleString('id-ID')}
                  </p>
                </button>
              ))
            ) : (
              <div
                className="text-center py-12 rounded-2xl border-2 border-dashed"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}
              >
                <span className="material-symbols-outlined text-[48px] mb-3 block" style={{ color: 'var(--color-outline)' }}>receipt_long</span>
                <p className="text-[14px] font-medium" style={{ color: 'var(--color-outline)' }}>Belum ada transaksi</p>
                <p className="text-[12px] mt-1" style={{ color: 'var(--color-outline)' }}>Tambah transaksi pertama kamu!</p>
                <button
                  onClick={() => navigate('/add')}
                  className="mt-4 px-6 py-2.5 rounded-full text-[13px] font-semibold active:scale-95 transition-transform"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
                >
                  + Tambah Transaksi
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
