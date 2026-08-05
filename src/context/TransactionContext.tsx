import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';
import { transactionService, supabase } from '../lib/supabase';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTransactions = useCallback(async () => {
    setLoading(true);
    const data = await transactionService.getTransactions();
    setTransactions(data);
    setLoading(false);
  }, []);

  // Refresh transaksi setiap kali user berubah (login/logout)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // User baru login — muat data miliknya
        refreshTransactions();
      } else {
        // User logout — bersihkan data
        setTransactions([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshTransactions]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const newTransaction = await transactionService.addTransaction(transaction);
    if (newTransaction) {
      setTransactions([newTransaction, ...transactions]);
      return true;
    }
    return false;
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const updatedTransaction = await transactionService.updateTransaction(id, updates);
    if (updatedTransaction) {
      setTransactions(transactions.map(t => (t.id === id ? updatedTransaction : t)));
      return true;
    }
    return false;
  };

  const deleteTransaction = async (id: string) => {
    const success = await transactionService.deleteTransaction(id);
    if (success) {
      setTransactions(transactions.filter(t => t.id !== id));
      return true;
    }
    return false;
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      loading,
      refreshTransactions,
      addTransaction,
      updateTransaction,
      deleteTransaction
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
