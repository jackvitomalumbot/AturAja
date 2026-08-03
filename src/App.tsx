import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TransactionProvider } from './context/TransactionContext';

import { Dashboard } from './pages/Dashboard';
import { AddTransaction } from './pages/AddTransaction';
import { Calendar } from './pages/Calendar';
import { History } from './pages/History';
import { Stats } from './pages/Stats';
import { TransactionDetail } from './pages/TransactionDetail';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <TransactionProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="history" element={<History />} />
            <Route path="history/:id" element={<TransactionDetail />} />
            <Route path="stats" element={<Stats />} />
            <Route path="add" element={<AddTransaction />} />
          </Route>
        </Routes>
      </TransactionProvider>
    </BrowserRouter>
  );
};

export default App;
