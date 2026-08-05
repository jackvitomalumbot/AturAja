export type TransactionSource = 'MANUAL' | 'AI';

export interface Transaction {
  id: string;
  user_id?: string;
  amount: number;
  merchant: string;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  image_url?: string | null;
  source: TransactionSource;
  created_at: string;
  updated_at: string;
}

export interface AIInsightData {
  dailySummary: {
    totalTransactions: number;
    totalAmount: number;
    topCategory: string;
    topMerchant: string;
  };
  weeklySummary: {
    totalTransactions: number;
    totalAmount: number;
    averageDaily: number;
    topCategory: string;
    topCategoryPercentage: number;
  };
  monthlySummary: {
    totalTransactions: number;
    totalAmount: number;
    highestExpenseWeek: string;
    topCategory: string;
  };
  analysis: string;
  recommendations: string[];
  estimatedMonthlyExpense?: number;
}

export const CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Shopping',
  'Bills',
  'Kesehatan',
  'Hiburan',
  'Pendidikan',
  'Other',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_ICONS: Record<string, string> = {
  'Food & Drinks': 'restaurant',
  'Transport': 'directions_car',
  'Shopping': 'shopping_bag',
  'Bills': 'receipt_long',
  'Kesehatan': 'medical_services',
  'Hiburan': 'sports_esports',
  'Pendidikan': 'school',
  'Other': 'category',
};

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drinks': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Transport': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Shopping': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Bills': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Kesehatan': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  'Hiburan': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Pendidikan': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};
