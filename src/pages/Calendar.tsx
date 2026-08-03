import React, { useState, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { useTransactions } from '../context/TransactionContext';
import { format, isSameDay, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../types';
import { useNavigate } from 'react-router-dom';

const pickerStyles = `
  .rdp-root { --rdp-accent-color: #334f2b; --rdp-background-color: #caecbc; font-family: 'Inter', sans-serif; }
  .rdp-selected .rdp-day_button { background-color: #334f2b !important; color: white !important; border-radius: 9999px; }
  .rdp-day_button:hover:not([disabled]) { background-color: var(--color-surface-container); border-radius: 9999px; }
  .rdp-today:not(.rdp-selected) .rdp-day_button { color: #334f2b; font-weight: 700; }
  .rdp-nav { gap: 8px; }
  .rdp-nav_button { border-radius: 9999px !important; }
  .rdp-month_caption { font-size: 15px; font-weight: 600; color: var(--color-on-surface); }
  .rdp-weekday { font-size: 11px; font-weight: 600; color: var(--color-outline); }
  .rdp-day_button { font-size: 13px; width: 36px; height: 36px; border-radius: 9999px; }
`;

function CategoryIcon({ category }: { category: string }) {
  const icon = CATEGORY_ICONS[category] ?? 'category';
  const colorClass = CATEGORY_COLORS[category] ?? 'bg-surface-container text-on-surface-variant';
  return (
    <div className={`w-11 h-11 flex items-center justify-center rounded-[20px] shrink-0 ${colorClass}`}>
      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    </div>
  );
}

export const Calendar: React.FC = () => {
  const { transactions } = useTransactions();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const selectedDateTransactions = useMemo(() =>
    transactions.filter(tx =>
      selectedDate && isSameDay(parseISO(tx.date), selectedDate)
    ).sort((a, b) => a.time.localeCompare(b.time)),
    [transactions, selectedDate]);

  const totalSpent = useMemo(() =>
    selectedDateTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [selectedDateTransactions]);

  // Dates that have transactions → for dot indicators
  const transactionDates = useMemo(() => {
    const dates = new Set<string>();
    transactions.forEach(tx => dates.add(tx.date));
    return dates;
  }, [transactions]);

  const hasTx = (date: Date) =>
    transactionDates.has(format(date, 'yyyy-MM-dd'));

  // Monthly total for header
  const monthTotal = useMemo(() => {
    if (!selectedDate) return 0;
    const monthStr = format(selectedDate, 'yyyy-MM');
    return transactions
      .filter(tx => tx.date.startsWith(monthStr))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions, selectedDate]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <style>{pickerStyles}</style>

      {/* TopAppBar */}
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex items-center px-5"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <h1 className="text-[22px] font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Kalender</h1>
      </header>

      <main className="pt-20 pb-32 px-5 max-w-xl mx-auto space-y-5">
        {/* Calendar Card */}
        <div
          className="rounded-[24px] border border-outline/5 shadow-sm overflow-hidden"
          style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
        >
          {/* Month total header */}
          <div className="px-5 pt-4 pb-2 border-b border-outline/5">
            <p className="text-[11px] font-medium" style={{ color: 'var(--color-outline)' }}>
              {selectedDate ? format(selectedDate, 'MMMM yyyy', { locale: id }) : ''}
            </p>
            <p className="text-[14px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
              Total: <span style={{ color: 'var(--color-primary)' }}>Rp{monthTotal.toLocaleString('id-ID')}</span>
            </p>
          </div>

          <div className="flex justify-center p-3">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={id}
              modifiers={{ hasTx: (date) => hasTx(date) }}
              modifiersClassNames={{
                hasTx: 'has-tx',
              }}
              modifiersStyles={{
                hasTx: { fontWeight: 700 },
              }}
              components={{
                DayButton: ({ day, modifiers, ...props }) => (
                  <button {...props} className={props.className}>
                    {format(day.date, 'd')}
                    {hasTx(day.date) && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '3px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          backgroundColor: modifiers.selected ? 'white' : '#4a6741',
                          display: 'block',
                        }}
                      />
                    )}
                  </button>
                ),
              }}
            />
          </div>
        </div>

        {/* Selected date summary */}
        <div
          className="rounded-[20px] p-4 border"
          style={{
            backgroundColor: 'var(--color-primary-container)',
            borderColor: 'rgba(74,103,65,0.2)',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[13px] font-semibold text-white">
                {selectedDate ? format(selectedDate, 'd MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
              </p>
              <p className="text-[11px] text-white/70 mt-0.5">{selectedDateTransactions.length} transaksi</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-white/70">Total</p>
              <p className="text-[20px] font-bold text-white">Rp{totalSpent.toLocaleString('id-ID')}</p>
            </div>
          </div>
        </div>

        {/* Transaction list for selected date */}
        <section>
          {selectedDateTransactions.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-[13px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                Daily Breakdown — {selectedDate ? format(selectedDate, 'd MMM', { locale: id }) : ''}
              </p>
              {selectedDateTransactions.map(tx => (
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
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
                      Rp{tx.amount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-12 rounded-2xl border-2 border-dashed"
              style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'var(--color-outline-variant)' }}
            >
              <span className="material-symbols-outlined text-[40px] mb-2 block" style={{ color: 'var(--color-outline)' }}>event_busy</span>
              <p className="text-[14px] font-medium" style={{ color: 'var(--color-outline)' }}>Tidak ada transaksi</p>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-outline)' }}>pada tanggal ini</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
