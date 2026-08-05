import { createClient } from '@supabase/supabase-js';
import type { Transaction } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const transactionService = {
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
    return data || [];
  },

  async addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    // Ambil user ID dari session yang aktif
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('[Supabase] INSERT error: user not authenticated');
      return null;
    }

    const payload = { ...transaction, user_id: user.id };
    console.log('[Supabase] INSERT payload:', JSON.stringify(payload));

    const { data, error } = await supabase
      .from('transactions')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[Supabase] INSERT error:', error.code, error.message, error.details, error.hint);
      return null;
    }
    console.log('[Supabase] INSERT success:', data);
    return data;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
    return data;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
    return true;
  }
};
