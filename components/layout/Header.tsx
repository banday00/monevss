'use client';

import { signOut } from 'next-auth/react';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header" id="header">
      <div className="header-left">
        <h2 className="header-title">Dashboard Monitoring dan Evaluasi Satu Data Kota Bogor</h2>
      </div>

      <div className="header-right">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          id="theme-toggle"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--bg-card-border)',
            color: 'var(--text-secondary)',
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 18,
            transition: 'all 0.25s ease',
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>


        <div className="header-user">
          <div className="header-avatar">A</div>
          <span className="header-username">Admin</span>
        </div>

        <button
          className="logout-btn"
          id="logout-btn"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          Keluar
        </button>
      </div>
    </header>
  );
}

