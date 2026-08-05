/**
 * Format angka dengan titik sebagai pemisah ribuan (format Indonesia)
 * Contoh: 75000 → "75.000"
 */
export const formatWithDots = (value: number | string): string => {
  const raw = typeof value === 'string' ? value.replace(/\./g, '') : String(value);
  if (raw === '' || raw === '0') return raw === '' ? '' : '0';
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('id-ID');
};

/**
 * Parse string berformat titik ke angka
 * Contoh: "75.000" → 75000
 */
export const parseDots = (formatted: string): number => {
  return parseInt(formatted.replace(/\./g, ''), 10) || 0;
};

/**
 * Handler untuk input angka dengan format titik otomatis.
 * Gunakan pada onChange input.
 * Returns { raw (number), display (string formatted) }
 */
export const handleNumberInput = (inputValue: string): { raw: number; display: string } => {
  // Hapus semua bukan angka
  const stripped = inputValue.replace(/[^0-9]/g, '');
  if (stripped === '') return { raw: 0, display: '' };
  const num = parseInt(stripped, 10);
  if (isNaN(num)) return { raw: 0, display: '' };
  return { raw: num, display: num.toLocaleString('id-ID') };
};

/**
 * Format sebagai Rupiah lengkap
 * Contoh: 75000 → "Rp 75.000"
 */
export const formatRupiah = (value: number): string =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
