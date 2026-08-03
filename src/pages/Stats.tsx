import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTransactions } from '../context/TransactionContext';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { format, startOfMonth, eachDayOfInterval, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import type { AIInsightData } from '../types';
import { CATEGORY_ICONS } from '../types';

const CHART_COLORS = ['#334f2b', '#4b6547', '#4a6741', '#73796f', '#afd0a1', '#cdebc5', '#bfc9bd'];

export const Stats: React.FC = () => {
  const { transactions } = useTransactions();
  const [aiInsight, setAiInsight] = useState<AIInsightData | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0); // 0 = this month

  const selectedDate = useMemo(() => subMonths(new Date(), selectedMonthOffset), [selectedMonthOffset]);
  const selectedMonthStr = format(selectedDate, 'yyyy-MM');

  const monthTransactions = useMemo(() =>
    transactions.filter(tx => tx.date.startsWith(selectedMonthStr)), [transactions, selectedMonthStr]);

  const totalSpent = useMemo(() =>
    monthTransactions.reduce((sum, tx) => sum + tx.amount, 0), [monthTransactions]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const totals = monthTransactions.reduce((acc, tx) => {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTransactions]);

  // Daily bar chart
  const monthDays = eachDayOfInterval({ start: startOfMonth(selectedDate), end: endOfMonth(selectedDate) });
  const dailyData = useMemo(() => {
    const byDay = monthTransactions.reduce((acc, tx) => {
      acc[tx.date] = (acc[tx.date] || 0) + tx.amount;
      return acc;
    }, {} as Record<string, number>);
    return monthDays.map(day => ({
      day: format(day, 'd'),
      total: byDay[format(day, 'yyyy-MM-dd')] || 0,
    }));
  }, [monthTransactions, monthDays]);

  // Largest spending merchant
  const largestSpending = useMemo(() => {
    if (monthTransactions.length === 0) return null;
    const byMerchant = monthTransactions.reduce((acc, tx) => {
      if (!acc[tx.merchant] || acc[tx.merchant] < tx.amount) acc[tx.merchant] = tx.amount;
      return acc;
    }, {} as Record<string, number>);
    const [merchant, amount] = Object.entries(byMerchant).sort((a, b) => b[1] - a[1])[0] ?? [];
    return merchant ? { merchant, amount } : null;
  }, [monthTransactions]);

  // Most visited merchant
  const mostVisited = useMemo(() => {
    if (monthTransactions.length === 0) return null;
    const counts = monthTransactions.reduce((acc, tx) => {
      acc[tx.merchant] = (acc[tx.merchant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const [merchant, visits] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
    return merchant ? { merchant, visits } : null;
  }, [monthTransactions]);

  // Source breakdown
  const aiCount = monthTransactions.filter(tx => tx.source === 'AI').length;
  const manualCount = monthTransactions.filter(tx => tx.source === 'MANUAL').length;

  const fetchInsights = useCallback(async () => {
    if (transactions.length === 0) return;
    setAiLoading(true);
    try {
      const res = await fetch('/.netlify/functions/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: monthTransactions.slice(0, 100) }),
      });
      if (!res.ok) return;
      const data: AIInsightData = await res.json();
      setAiInsight(data);
    } catch {
      // silently fail
    } finally {
      setAiLoading(false);
    }
  }, [monthTransactions, transactions.length]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* TopAppBar */}
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex items-center justify-between px-5"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div>
          <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Statistik</h1>
          <p className="text-[11px]" style={{ color: 'var(--color-outline)' }}>Analisis pengeluaran kamu</p>
        </div>
        {/* Month navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedMonthOffset(prev => prev + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-on-surface-variant)' }}>chevron_left</span>
          </button>
          <span className="text-[12px] font-semibold px-2" style={{ color: 'var(--color-on-surface)' }}>
            {format(selectedDate, 'MMM yyyy', { locale: id })}
          </span>
          <button
            onClick={() => setSelectedMonthOffset(prev => Math.max(0, prev - 1))}
            disabled={selectedMonthOffset === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-30"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-on-surface-variant)' }}>chevron_right</span>
          </button>
        </div>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-xl mx-auto space-y-5">

        {/* ── Total card ── */}
        <div
          className="p-6 rounded-[24px] shadow-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--color-primary-container) 0%, #2d4a25 100%)' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[12px] text-white/70 mb-1">
              {format(selectedDate, 'MMMM yyyy', { locale: id })} · {monthTransactions.length} transaksi
            </p>
            <h2 className="text-[30px] font-bold text-white tracking-tight">
              Rp{totalSpent.toLocaleString('id-ID')}
            </h2>
            <div className="flex gap-2 mt-3">
              <span className="bg-white/15 px-3 py-1 rounded-full text-[11px] text-white font-medium">
                📝 {manualCount} Manual
              </span>
              <span className="bg-white/15 px-3 py-1 rounded-full text-[11px] text-white font-medium">
                🤖 {aiCount} AI Scan
              </span>
            </div>
          </div>
        </div>

        {/* ── Largest Spending + Most Visited ── */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-[20px] p-4 border border-outline/5 shadow-sm"
            style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-outline)' }}>
              Pengeluaran Terbesar
            </p>
            {largestSpending ? (
              <>
                <div className="w-10 h-10 rounded-2xl mb-2 flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary-container)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-on-secondary-container)', fontVariationSettings: "'FILL' 1" }}>payments</span>
                </div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--color-on-surface)' }}>{largestSpending.merchant}</p>
                <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--color-primary)' }}>
                  Rp{largestSpending.amount.toLocaleString('id-ID')}
                </p>
              </>
            ) : (
              <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Tidak ada data</p>
            )}
          </div>

          <div
            className="rounded-[20px] p-4 border border-outline/5 shadow-sm"
            style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-outline)' }}>
              Merchant Favorit
            </p>
            {mostVisited ? (
              <>
                <div className="w-10 h-10 rounded-2xl mb-2 flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary-fixed)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>store</span>
                </div>
                <p className="text-[13px] font-bold" style={{ color: 'var(--color-on-surface)' }}>{mostVisited.merchant}</p>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                  {mostVisited.visits} kunjungan
                </p>
              </>
            ) : (
              <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Tidak ada data</p>
            )}
          </div>
        </div>

        {/* ── Daily bar chart ── */}
        <div
          className="p-5 rounded-[24px] border border-outline/5 shadow-sm"
          style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
        >
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--color-on-surface)' }}>
            Pengeluaran Harian
          </h3>
          {dailyData.some(d => d.total > 0) ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--color-outline)' }} interval={4} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-outline)' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Pengeluaran']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backgroundColor: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                  />
                  <Bar dataKey="total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-center py-8 text-[13px]" style={{ color: 'var(--color-outline)' }}>Belum ada data bulan ini</p>
          )}
        </div>

        {/* ── Top Categories ── */}
        <div
          className="p-5 rounded-[24px] border border-outline/5 shadow-sm"
          style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
        >
          <h3 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--color-on-surface)' }}>Top Kategori</h3>
          {categoryData.length > 0 ? (
            <div className="space-y-3">
              {categoryData.slice(0, 5).map((cat, i) => {
                const pct = totalSpent > 0 ? Math.round((cat.value / totalSpent) * 100) : 0;
                const icon = CATEGORY_ICONS[cat.name] ?? 'category';
                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] + '20' }}
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ color: CHART_COLORS[i % CHART_COLORS.length], fontVariationSettings: "'FILL' 1" }}
                        >{icon}</span>
                      </div>
                      <span className="flex-1 text-[13px]" style={{ color: 'var(--color-on-surface)' }}>{cat.name}</span>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--color-outline)' }}>{pct}%</span>
                      <span className="text-[13px] font-semibold w-24 text-right" style={{ color: 'var(--color-on-surface)' }}>
                        Rp{(cat.value / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-surface-container-high)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-[13px]" style={{ color: 'var(--color-outline)' }}>Belum ada data</p>
          )}
        </div>

        {/* ── Pie Chart ── */}
        {categoryData.length > 0 && (
          <div
            className="p-5 rounded-[24px] border border-outline/5 shadow-sm"
            style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
          >
            <h3 className="text-[14px] font-semibold mb-2" style={{ color: 'var(--color-on-surface)' }}>Distribusi Kategori</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`Rp${Number(v).toLocaleString('id-ID')}`, 'Total']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', backgroundColor: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── AI Financial Health Check ── */}
        <div
          className="rounded-[24px] border border-outline/5 shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
        >
          <div
            className="p-4 flex items-center justify-between"
            style={{ backgroundColor: 'var(--color-primary-fixed)' }}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-on-primary-fixed)', fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
              <h3 className="text-[14px] font-semibold" style={{ color: 'var(--color-on-primary-fixed)' }}>AI Financial Health Check</h3>
            </div>
            <button
              onClick={fetchInsights}
              disabled={aiLoading}
              className="flex items-center gap-1 text-[11px] font-medium transition-opacity disabled:opacity-50"
              style={{ color: 'var(--color-on-primary-fixed)' }}
            >
              <span className={`material-symbols-outlined text-[14px] ${aiLoading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>

          <div className="p-5">
            {aiLoading ? (
              <div className="space-y-3">
                <div className="h-3 rounded-full animate-shimmer w-full" />
                <div className="h-3 rounded-full animate-shimmer w-5/6" />
                <div className="h-3 rounded-full animate-shimmer w-4/6" />
              </div>
            ) : aiInsight ? (
              <div className="space-y-4 animate-slide-up">
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>
                  {aiInsight.analysis}
                </p>

                {aiInsight.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    {aiInsight.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 p-3 rounded-xl"
                        style={{ backgroundColor: 'var(--color-surface-container)' }}
                      >
                        <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-on-surface-variant)' }}>{rec}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : monthTransactions.length === 0 ? (
              <p className="text-[13px] text-center py-4" style={{ color: 'var(--color-outline)' }}>
                Tambahkan transaksi untuk mendapatkan insight AI
              </p>
            ) : (
              <button
                onClick={fetchInsights}
                className="w-full py-3 rounded-xl text-[13px] font-semibold transition-all active:scale-95"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
              >
                Analisis dengan AI
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
