import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../context/TransactionContext';
import { format } from 'date-fns';
import { CATEGORIES } from '../types';

interface AIResult {
  merchant: string | null;
  amount: number | null;
  date: string | null;
  time: string | null;
  category: string | null;
  confidence: number | null;
  note?: string | null;
}

export const AddTransaction: React.FC = () => {
  const { addTransaction } = useTransactions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'AI'>('MANUAL');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Manual form state
  const today = format(new Date(), 'yyyy-MM-dd');
  const nowTime = format(new Date(), 'HH:mm');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(today);
  const [time, setTime] = useState(nowTime);
  const [note, setNote] = useState('');

  // AI Scan state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetManualForm = () => {
    setAmount(''); setMerchant(''); setCategory('');
    setDate(today); setTime(nowTime); setNote('');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(''); navigate('/'); }, 1500);
  };

  // Normalize time to HH:MM:SS as required by PostgreSQL time column
  const normalizeTime = (t: string) => t.length === 5 ? `${t}:00` : t;

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) { setErrorMsg('Nominal harus diisi dan lebih dari 0'); return; }
    if (!merchant.trim()) { setErrorMsg('Merchant wajib diisi'); return; }
    if (!category) { setErrorMsg('Kategori wajib dipilih'); return; }
    if (!date) { setErrorMsg('Tanggal wajib diisi'); return; }
    if (!time) { setErrorMsg('Jam wajib diisi'); return; }

    setErrorMsg('');
    setSubmitting(true);
    const ok = await addTransaction({
      amount: Number(amount), merchant: merchant.trim(), category,
      date, time: normalizeTime(time), note: note.trim(), source: 'MANUAL', image_url: null,
    });
    setSubmitting(false);
    if (ok) { resetManualForm(); showSuccess('Transaksi berhasil disimpan!'); }
    else { setErrorMsg('Gagal menyimpan transaksi. Periksa koneksi Supabase.'); }
  };

  // Compress image to max 900px and quality 0.75 to stay under Netlify 1MB body limit
  const compressImage = (file: File): Promise<{ base64: string; mimeType: string }> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 900;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        const base64 = canvas.toDataURL('image/jpeg', 0.75);
        URL.revokeObjectURL(url);
        resolve({ base64, mimeType: 'image/jpeg' });
      };
      img.src = url;
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiResult(null); setAiError('');
    const { base64, mimeType } = await compressImage(file);
    setImageMimeType(mimeType);
    setImagePreview(base64);
    setImageBase64(base64);
  };

  const handleScanAI = async () => {
    if (!imageBase64) return;
    setAiLoading(true); setAiError(''); setAiResult(null);
    try {
      const res = await fetch('/.netlify/functions/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: imageMimeType }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error || `HTTP ${res.status}`);
      }
      const data: AIResult = await res.json();
      if (!data.amount && !data.merchant) throw new Error('AI tidak dapat membaca struk ini');
      setAiResult(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membaca struk';
      setAiError(`AI Scan gagal: ${msg}. Coba gambar yang lebih jelas atau input manual.`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAI = async () => {
    if (!aiResult) return;
    if (!aiResult.amount || aiResult.amount <= 0) { setAiError('Nominal tidak valid. Edit terlebih dahulu.'); return; }
    if (!aiResult.merchant) { setAiError('Merchant tidak terbaca. Edit terlebih dahulu.'); return; }
    if (!aiResult.category) { setAiError('Kategori tidak terbaca. Edit terlebih dahulu.'); return; }
    if (!aiResult.date) { setAiError('Tanggal tidak terbaca. Edit terlebih dahulu.'); return; }
    if (!aiResult.time) { setAiError('Jam tidak terbaca. Edit terlebih dahulu.'); return; }

    setSubmitting(true);
    const ok = await addTransaction({
      amount: aiResult.amount, merchant: aiResult.merchant, category: aiResult.category,
      date: aiResult.date, time: normalizeTime(aiResult.time), note: aiResult.note ?? '',
      source: 'AI', image_url: imageBase64 ?? null,
    });
    setSubmitting(false);
    if (ok) {
      setAiResult(null); setImagePreview(null); setImageBase64(null);
      showSuccess('Transaksi AI berhasil disimpan!');
    } else {
      setAiError('Gagal menyimpan. Periksa koneksi Supabase.');
    }
  };

  const confidenceBadge = (c: number | null) => {
    if (c === null) return null;
    const pct = Math.round(c * 100);
    if (c >= 0.9) return { label: `🟢 ${pct}%`, bg: '#dcfce7', color: '#15803d' };
    if (c >= 0.7) return { label: `🟡 ${pct}%`, bg: '#fef9c3', color: '#a16207' };
    return { label: `🔴 ${pct}%`, bg: '#fee2e2', color: '#b91c1c' };
  };

  const fieldStyle = {
    backgroundColor: 'var(--color-surface-container)',
    color: 'var(--color-on-surface)',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* TopAppBar */}
      <header
        className="fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex items-center px-5 gap-3"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-surface-container)' }}
        >
          <span className="material-symbols-outlined" style={{ color: 'var(--color-on-surface)' }}>arrow_back</span>
        </button>
        <h1 className="text-[18px] font-bold tracking-tight" style={{ color: 'var(--color-primary)' }}>Tambah Transaksi</h1>
      </header>

      <main className="pt-24 pb-32 px-5 max-w-xl mx-auto space-y-5">
        {/* Messages */}
        {successMsg && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-2 animate-slide-up" style={{ backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <p className="text-[13px] font-medium">{successMsg}</p>
          </div>
        )}
        {errorMsg && (
          <div className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
            <span className="material-symbols-outlined text-[18px]">error</span>
            <p className="text-[13px]">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="ml-auto">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex rounded-full p-1 shadow-sm" style={{ backgroundColor: 'var(--color-surface-container-low)' }}>
          <button
            onClick={() => setActiveTab('MANUAL')}
            className="flex-1 py-2.5 px-6 rounded-full text-[13px] font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeTab === 'MANUAL' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'MANUAL' ? 'var(--color-on-primary)' : 'var(--color-outline)',
              boxShadow: activeTab === 'MANUAL' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            📝 Manual
          </button>
          <button
            onClick={() => setActiveTab('AI')}
            className="flex-1 py-2.5 px-6 rounded-full text-[13px] font-semibold transition-all duration-200"
            style={{
              backgroundColor: activeTab === 'AI' ? 'var(--color-primary)' : 'transparent',
              color: activeTab === 'AI' ? 'var(--color-on-primary)' : 'var(--color-outline)',
              boxShadow: activeTab === 'AI' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            🤖 AI Scan
          </button>
        </div>

        {/* ── MANUAL INPUT ── */}
        {activeTab === 'MANUAL' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 p-6 rounded-[24px] border border-outline/5 shadow-sm animate-fade-in" style={{ backgroundColor: 'var(--color-surface-container-lowest)' }}>
            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Nominal *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[14px] font-semibold" style={{ color: 'var(--color-on-surface-variant)' }}>Rp</span>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  className="w-full h-14 pl-10 pr-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all"
                  style={fieldStyle} placeholder="0" min="1" required
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Merchant *</label>
              <input
                type="text" value={merchant} onChange={e => setMerchant(e.target.value)}
                className="w-full h-14 px-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all"
                style={fieldStyle} placeholder="Indomaret, Grab, dll" required
              />
            </div>

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Kategori *</label>
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                className="w-full h-14 px-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all appearance-none"
                style={fieldStyle} required
              >
                <option value="" disabled>Pilih kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Tanggal *</label>
                <input
                  type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl text-[14px] focus:outline-none focus:ring-2 transition-all"
                  style={fieldStyle} required
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Jam *</label>
                <input
                  type="time" value={time} onChange={e => setTime(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl text-[14px] focus:outline-none focus:ring-2 transition-all"
                  style={fieldStyle} required
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--color-on-surface)' }}>Catatan (opsional)</label>
              <input
                type="text" value={note} onChange={e => setNote(e.target.value)}
                className="w-full h-14 px-4 rounded-xl text-[16px] focus:outline-none focus:ring-2 transition-all"
                style={fieldStyle} placeholder="Tambahkan catatan..."
              />
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full h-14 rounded-xl text-[15px] font-semibold mt-2 active:scale-95 transition-transform disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
            >
              {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </form>
        )}

        {/* ── AI SCAN ── */}
        {activeTab === 'AI' && (
          <div className="space-y-4 animate-fade-in">
            {/* Upload Area */}
            <div
              className="relative cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all duration-300 group"
              style={{
                borderColor: imagePreview ? 'var(--color-primary)' : 'var(--color-outline-variant)',
                backgroundColor: 'var(--color-surface-container-lowest)',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-60 rounded-xl object-contain" />
              ) : (
                <>
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: 'var(--color-secondary-container)' }}
                  >
                    <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--color-on-surface)' }}>Upload Screenshot Struk</h3>
                  <p className="text-[12px] text-center max-w-[220px]" style={{ color: 'var(--color-outline)' }}>
                    Pilih atau ambil foto struk transaksi kamu
                  </p>
                </>
              )}
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>

            {imagePreview && (
              <button
                onClick={() => { setImagePreview(null); setImageBase64(null); setAiResult(null); setAiError(''); }}
                className="w-full text-center text-[12px] font-medium"
                style={{ color: 'var(--color-outline)' }}
              >
                ✕ Ganti gambar
              </button>
            )}

            {imagePreview && !aiResult && (
              <button
                onClick={handleScanAI}
                disabled={aiLoading}
                className="w-full h-14 rounded-xl text-[15px] font-semibold active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
              >
                {aiLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                    AI sedang membaca...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    Scan dengan AI
                  </>
                )}
              </button>
            )}

            {aiError && (
              <div className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
                <span className="material-symbols-outlined text-[18px]">error</span>
                <p className="text-[12px]">{aiError}</p>
              </div>
            )}

            {/* AI Result */}
            {aiResult && (
              <div
                className="border rounded-2xl p-5 space-y-4 shadow-sm animate-slide-up"
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderColor: 'rgba(74,103,65,0.3)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    <h3 className="text-[14px] font-semibold" style={{ color: 'var(--color-on-surface)' }}>Hasil AI</h3>
                  </div>
                  {(() => {
                    const badge = confidenceBadge(aiResult.confidence);
                    return badge ? (
                      <span
                        className="px-3 py-1 rounded-full text-[12px] font-semibold"
                        style={{ backgroundColor: badge.bg, color: badge.color }}
                      >
                        {badge.label} Confidence
                      </span>
                    ) : null;
                  })()}
                </div>

                {aiResult.confidence !== null && aiResult.confidence < 0.7 && (
                  <div className="px-3 py-2 rounded-lg text-[11px]" style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}>
                    ⚠️ Confidence rendah. Harap periksa dan edit data sebelum menyimpan.
                  </div>
                )}

                {/* Editable fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>Merchant</label>
                    <input
                      className="w-full h-12 px-3 rounded-lg text-[14px] focus:outline-none focus:ring-2 transition-all"
                      style={fieldStyle}
                      value={aiResult.merchant ?? ''}
                      onChange={e => setAiResult({ ...aiResult, merchant: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>Nominal</label>
                    <input
                      type="number"
                      className="w-full h-12 px-3 rounded-lg text-[14px] focus:outline-none focus:ring-2 transition-all"
                      style={fieldStyle}
                      value={aiResult.amount ?? ''}
                      onChange={e => setAiResult({ ...aiResult, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>Tanggal</label>
                      <input
                        type="date"
                        className="w-full h-12 px-3 rounded-lg text-[13px] focus:outline-none focus:ring-2 transition-all"
                        style={fieldStyle}
                        value={aiResult.date ?? ''}
                        onChange={e => setAiResult({ ...aiResult, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>Jam</label>
                      <input
                        type="time"
                        className="w-full h-12 px-3 rounded-lg text-[13px] focus:outline-none focus:ring-2 transition-all"
                        style={fieldStyle}
                        value={aiResult.time ?? ''}
                        onChange={e => setAiResult({ ...aiResult, time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--color-outline)' }}>Kategori</label>
                    <select
                      className="w-full h-12 px-3 rounded-lg text-[14px] focus:outline-none focus:ring-2 transition-all appearance-none"
                      style={fieldStyle}
                      value={aiResult.category ?? ''}
                      onChange={e => setAiResult({ ...aiResult, category: e.target.value })}
                    >
                      <option value="" disabled>Pilih kategori</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { setAiResult(null); setImagePreview(null); setImageBase64(null); }}
                    className="flex-1 h-12 rounded-xl text-[13px] font-semibold transition-colors"
                    style={{ backgroundColor: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)' }}
                  >
                    Scan Ulang
                  </button>
                  <button
                    onClick={handleSaveAI}
                    disabled={submitting}
                    className="flex-1 h-12 rounded-xl text-[13px] font-semibold active:scale-95 transition-transform disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-primary)' }}
                  >
                    {submitting ? 'Menyimpan...' : 'Konfirmasi & Simpan'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
