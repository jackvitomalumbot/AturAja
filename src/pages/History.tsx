import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { format, parseISO, isToday, isThisWeek, isThisMonth, isThisYear } from 'date-fns';
import { id } from 'date-fns/locale';
import { CATEGORY_ICONS, CATEGORY_COLORS, CATEGORIES } from '../types';

type DateFilter = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
type SourceFilter = 'ALL' | 'MANUAL' | 'AI';

function CategoryIcon({ category }: { category: string }) {
  const icon = CATEGORY_ICONS[category] ?? 'category';
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-surface-container text-on-surface-variant';
  return (
    <div className={`w-11 h-11 flex items-center justify-center rounded-[20px] shrink-0 ${colorClass}`}>
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    </div>
  );
}

export const History: React.FC = () => {
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Date filter
      if (dateFilter !== 'ALL') {
        const d = parseISO(tx.date);
        if (dateFilter === 'TODAY' && !isToday(d)) return false;
        if (dateFilter === 'WEEK' && !isThisWeek(d)) return false;
        if (dateFilter === 'MONTH' && !isThisMonth(d)) return false;
        if (dateFilter === 'YEAR' && !isThisYear(d)) return false;
      }

      // Source filter
      if (sourceFilter !== 'ALL' && tx.source !== sourceFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && tx.category !== categoryFilter) return false;

      // Search
      const q = searchTerm.toLowerCase();
      if (q) {
        const matchesSearch =
          tx.merchant.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          tx.amount.toString().includes(q);
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [transactions, dateFilter, sourceFilter, categoryFilter, searchTerm]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof filteredTransactions> = {};
    filteredTransactions.forEach(tx => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredTransactions]);

  const totalAmount = useMemo(() =>
    filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0), [filteredTransactions]);

  const DATE_FILTER_LABELS: Record<DateFilter, string> = {
    ALL: 'Semua', TODAY: 'Hari ini', WEEK: 'Minggu', MONTH: 'Bulan', YEAR: 'Tahun',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* TopAppBar */}
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex items-center justify-between px-5"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Riwayat</h1>
        <button
          onClick={() => setShowCategoryFilter(!showCategoryFilter)}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: showCategoryFilter ? 'var(--color-secondary-container)' : 'transparent' }}
        >
          <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-on-surface-variant)' }}>filter_list</span>
        </button>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px]" style={{ color: 'var(--color-outline)' }}>search</span>
          <input
            type="text"
            placeholder="Cari merchant, kategori, catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-xl text-[14px] focus:outline-none focus:ring-2 transition-all"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-outline)' }}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Date filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {(Object.keys(DATE_FILTER_LABELS) as DateFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all shrink-0"
              style={{
                backgroundColor: dateFilter === f ? 'var(--color-primary)' : 'var(--color-surface-container)',
                color: dateFilter === f ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
              }}
            >
              {DATE_FILTER_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Source filter */}
        <div className="flex gap-2">
          {(['ALL', 'MANUAL', 'AI'] as SourceFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={{
                backgroundColor: sourceFilter === f ? 'var(--color-secondary-container)' : 'var(--color-surface-container)',
                color: sourceFilter === f ? 'var(--color-on-secondary-container)' : 'var(--color-on-surface-variant)',
              }}
            >
              {f === 'ALL' ? 'Semua' : f === 'MANUAL' ? '📝 Manual' : '🤖 AI Scan'}
            </button>
          ))}
          <span className="ml-auto text-[12px] self-center" style={{ color: 'var(--color-outline)' }}>
            {filteredTransactions.length} transaksi
          </span>
        </div>

        {/* Category filter (expandable) */}
        {showCategoryFilter && (
          <div className="flex gap-2 flex-wrap animate-slide-up">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
              style={{
                backgroundColor: categoryFilter === 'ALL' ? 'var(--color-primary)' : 'var(--color-surface-container)',
                color: categoryFilter === 'ALL' ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
              }}
            >
              Semua Kategori
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor: categoryFilter === cat ? 'var(--color-primary)' : 'var(--color-surface-container)',
                  color: categoryFilter === cat ? 'var(--color-on-primary)' : 'var(--color-on-surface-variant)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Total summary */}
        {filteredTransactions.length > 0 && (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-2xl"
            style={{ backgroundColor: 'var(--color-primary-fixed)' }}
          >
            <span className="text-[13px] font-medium" style={{ color: 'var(--color-on-primary-fixed)' }}>
              Total {filteredTransactions.length} transaksi
            </span>
            <span className="text-[15px] font-bold" style={{ color: 'var(--color-on-primary-fixed)' }}>
              Rp{totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        )}

        {/* Grouped transaction list */}
        <div className="space-y-5">
          {groupedTransactions.length > 0 ? (
            groupedTransactions.map(([date, txs]) => {
              const dayTotal = txs.reduce((sum, tx) => sum + tx.amount, 0);
              return (
                <div key={date} className="space-y-2">
                  {/* Date header */}
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>
                      {format(parseISO(date), 'EEEE, d MMM yyyy', { locale: id })}
                    </p>
                    <p className="text-[12px] font-semibold" style={{ color: 'var(--color-primary)' }}>
                      Rp{dayTotal.toLocaleString('id-ID')}
                    </p>
                  </div>

                  {txs.map(tx => (
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
                          <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            tx.source === 'AI' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {tx.source === 'AI' ? '🤖 AI' : '📝'}
                          </span>
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-outline)' }}>
                          {tx.category} • {tx.time}
                        </p>
                        {tx.note ? <p className="text-[11px] italic truncate mt-0.5" style={{ color: 'var(--color-on-surface-variant)' }}>{tx.note}</p> : null}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                          Rp{tx.amount.toLocaleString('id-ID')}
                        </p>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--color-outline)' }}>chevron_right</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          ) : (
            <div
              className="text-center py-16 rounded-2xl border-2 border-dashed"
              style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}
            >
              <span className="material-symbols-outlined text-[48px] mb-2 block" style={{ color: 'var(--color-outline)' }}>search_off</span>
              <p className="text-[14px] font-medium" style={{ color: 'var(--color-outline)' }}>
                {searchTerm || categoryFilter !== 'ALL' || dateFilter !== 'ALL' ? 'Tidak ada hasil' : 'Belum ada transaksi'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
