import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS } from '../types';

export const TransactionDetail: React.FC = () => {
  const { id: txId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, updateTransaction, deleteTransaction } = useTransactions();

  const transaction = useMemo(() =>
    transactions.find(tx => tx.id === txId), [transactions, txId]);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit form state (initialise from transaction)
  const [editAmount, setEditAmount] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editNote, setEditNote] = useState('');

  const startEdit = () => {
    if (!transaction) return;
    setEditAmount(String(transaction.amount));
    setEditMerchant(transaction.merchant);
    setEditCategory(transaction.category);
    setEditDate(transaction.date);
    setEditTime(transaction.time);
    setEditNote(transaction.note ?? '');
    setIsEditing(true);
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (!transaction) return;
    if (!editAmount || Number(editAmount) <= 0) { setErrorMsg('Nominal harus lebih dari 0'); return; }
    if (!editMerchant.trim()) { setErrorMsg('Merchant wajib diisi'); return; }
    if (!editCategory) { setErrorMsg('Kategori wajib dipilih'); return; }
    if (!editDate) { setErrorMsg('Tanggal wajib diisi'); return; }
    if (!editTime) { setErrorMsg('Jam wajib diisi'); return; }

    setErrorMsg('');
    setSaving(true);
    const ok = await updateTransaction(transaction.id, {
      amount: Number(editAmount),
      merchant: editMerchant.trim(),
      category: editCategory,
      date: editDate,
      time: editTime,
      note: editNote.trim(),
    });
    setSaving(false);

    if (ok) {
      setSuccessMsg('Transaksi berhasil diperbarui!');
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(''), 2000);
    } else {
      setErrorMsg('Gagal menyimpan. Periksa koneksi.');
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setDeleting(true);
    const ok = await deleteTransaction(transaction.id);
    setDeleting(false);
    if (ok) {
      navigate('/history');
    }
  };

  if (!transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5" style={{ backgroundColor: 'var(--color-background)' }}>
        <span className="material-symbols-outlined text-[56px] mb-3" style={{ color: 'var(--color-outline)' }}>receipt_long</span>
        <p className="text-[15px] font-medium" style={{ color: 'var(--color-outline)' }}>Transaksi tidak ditemukan</p>
        <button
          onClick={() => navigate('/history')}
          className="mt-4 px-6 py-2.5 rounded-full text-[13px] font-semibold"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
        >
          Kembali ke Riwayat
        </button>
      </div>
    );
  }

  const categoryIcon = CATEGORY_ICONS[transaction.category] ?? 'category';
  const categoryColor = CATEGORY_COLORS[transaction.category] ?? 'bg-surface-container text-on-surface-variant';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* TopAppBar */}
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex items-center justify-between px-5"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
            style={{ backgroundColor: 'var(--color-surface-container)' }}
          >
            <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface)' }}>arrow_back</span>
          </button>
          <h1 className="text-[17px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>
            {isEditing ? 'Edit Transaksi' : 'Detail Transaksi'}
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all"
            style={{ backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit
          </button>
        )}
      </header>

      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto space-y-5">
        {/* Messages */}
        {successMsg && (
          <div
            className="px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-up"
            style={{ backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <p className="text-[13px] font-medium">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div
            className="px-4 py-3 rounded-xl flex items-center gap-2"
            style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
          >
            <span className="material-symbols-outlined text-[18px]">error</span>
            <p className="text-[13px]">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="ml-auto">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <div className="animate-fade-in space-y-4">
            {/* Hero Card */}
            <div
              className="p-6 rounded-[24px] shadow-lg relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, var(--color-primary-container) 0%, #2d4a25 100%)' }}
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center mb-4 ${categoryColor}`}>
                  <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: "'FILL' 1" }}>{categoryIcon}</span>
                </div>
                <p className="text-[13px] text-white/70 mb-1">{transaction.merchant}</p>
                <h2 className="text-[34px] font-bold text-white tracking-tight">
                  Rp{transaction.amount.toLocaleString('id-ID')}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    transaction.source === 'AI'
                      ? 'bg-green-400/20 text-green-200'
                      : 'bg-white/15 text-white/80'
                  }`}>
                    {transaction.source === 'AI' ? '🤖 AI Scan' : '📝 Manual'}
                  </span>
                  <span className="text-[12px] text-white/60">
                    {format(parseISO(transaction.date), 'd MMM yyyy', { locale: id })} • {transaction.time}
                  </span>
                </div>
              </div>
            </div>

            {/* Details list */}
            <div
              className="rounded-[20px] border border-outline/5 shadow-sm overflow-hidden"
              style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
            >
              {[
                { label: 'Merchant', value: transaction.merchant, icon: 'store' },
                { label: 'Kategori', value: transaction.category, icon: categoryIcon },
                {
                  label: 'Tanggal & Waktu',
                  value: `${format(parseISO(transaction.date), 'EEEE, d MMMM yyyy', { locale: id })} • ${transaction.time}`,
                  icon: 'schedule'
                },
                ...(transaction.note ? [{ label: 'Catatan', value: transaction.note, icon: 'notes' }] : []),
              ].map((item, i, arr) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-3 px-5 py-4 ${i < arr.length - 1 ? 'border-b border-outline/5' : ''}`}
                >
                  <span
                    className="material-symbols-outlined text-[20px] mt-0.5 shrink-0"
                    style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
                  >{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-medium mb-0.5" style={{ color: 'var(--color-outline)' }}>{item.label}</p>
                    <p className="text-[14px]" style={{ color: 'var(--color-on-surface)' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Screenshot preview if AI scan */}
            {transaction.source === 'AI' && transaction.image_url && (
              <div
                className="rounded-[20px] border border-outline/5 shadow-sm overflow-hidden"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
              >
                <div className="px-5 py-3 border-b border-outline/5 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>image</span>
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>Bukti Transaksi</p>
                </div>
                <img
                  src={transaction.image_url}
                  alt="Receipt"
                  className="w-full object-contain max-h-72"
                />
              </div>
            )}

            {/* Created/Updated timestamps */}
            <p className="text-[11px] text-center" style={{ color: 'var(--color-outline)' }}>
              Dibuat: {format(parseISO(transaction.created_at), 'd MMM yyyy HH:mm', { locale: id })}
            </p>

            {/* Delete button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Hapus Transaksi
            </button>
          </div>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <div className="animate-slide-up space-y-4">
            <div
              className="rounded-[24px] border border-outline/5 shadow-sm p-5 space-y-4"
              style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
            >
              {/* Amount */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Nominal *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>Rp</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={e => setEditAmount(e.target.value)}
                    className="w-full h-14 pl-10 pr-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                    placeholder="0"
                    min="1"
                  />
                </div>
              </div>

              {/* Merchant */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Merchant *</label>
                <input
                  type="text"
                  value={editMerchant}
                  onChange={e => setEditMerchant(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all"
                  style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Kategori *</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all appearance-none"
                  style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                >
                  <option value="" disabled>Pilih kategori</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Tanggal *</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl text-[14px] focus:outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Jam *</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl text-[14px] focus:outline-none focus:ring-2 transition-all"
                    style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Catatan (opsional)</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all"
                  style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface)' }}
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>

            {/* Edit action buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(false); setErrorMsg(''); }}
                className="flex-1 h-13 py-3.5 rounded-xl text-[14px] font-semibold transition-all"
                style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-13 py-3.5 rounded-xl text-[14px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
              >
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-5 animate-fade-in"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-[28px] p-6 shadow-2xl space-y-4 animate-slide-up"
            style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-error-container)' }}>
                <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--color-on-error-container)', fontVariationSettings: "'FILL' 1" }}>delete</span>
              </div>
              <div>
                <h3 className="text-[16px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>Hapus Transaksi?</h3>
                <p className="text-[12px]" style={{ color: 'var(--color-outline)' }}>Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold"
                style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold transition-all active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-on-error)' }}
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
