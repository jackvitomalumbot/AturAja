import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/calendar', label: 'Kalender', icon: 'calendar_today' },
  { path: '/history', label: 'Riwayat', icon: 'history' },
  { path: '/stats', label: 'Statistik', icon: 'insights' },
];

export const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Show FAB only on main nav pages (not on /add or detail pages)
  const isMainPage = NAV_ITEMS.some(item => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-background">
      {/* Page Content */}
      <Outlet />

      {/* FAB — only on main pages */}
      {isMainPage && (
        <button
          id="fab-add"
          onClick={() => navigate('/add')}
          className="fixed bottom-24 right-5 w-14 h-14 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all duration-200 z-50 hover:shadow-primary/30 hover:scale-105"
          aria-label="Tambah Transaksi"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 w-full z-40 border-t border-outline/10 h-[68px] flex justify-around items-center px-2"
        style={{ backgroundColor: 'var(--color-surface)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              id={`nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'text-outline hover:text-primary'
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
