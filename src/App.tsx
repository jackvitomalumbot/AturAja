import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TransactionProvider } from './context/TransactionContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import { Dashboard } from './pages/Dashboard';
import { AddTransaction } from './pages/AddTransaction';
import { Calendar } from './pages/Calendar';
import { History } from './pages/History';
import { Stats } from './pages/Stats';
import { TransactionDetail } from './pages/TransactionDetail';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';

// Route guard: redirect ke /login jika belum login
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <span
          className="material-symbols-outlined animate-spin text-[40px]"
          style={{ color: 'var(--color-primary)' }}
        >
          progress_activity
        </span>
        <p className="text-sm" style={{ color: 'var(--color-on-surface-variant)' }}>Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Redirect ke / jika sudah login
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <span className="material-symbols-outlined animate-spin text-[40px]" style={{ color: 'var(--color-primary)' }}>
          progress_activity
        </span>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TransactionProvider>
          <Routes>
            {/* Public route — login */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="history" element={<History />} />
              <Route path="history/:id" element={<TransactionDetail />} />
              <Route path="stats" element={<Stats />} />
              <Route path="add" element={<AddTransaction />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TransactionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
