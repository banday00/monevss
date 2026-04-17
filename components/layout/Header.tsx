'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

export default function Header() {
  const [nextRefresh, setNextRefresh] = useState(300);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const interval = setInterval(() => {
      setNextRefresh((prev) => {
        if (prev <= 1) {
          // Trigger page refresh
          window.location.reload();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

        <div className="header-refresh-timer" id="refresh-timer">
          🔄 Refresh: {formatCountdown(nextRefresh)}
        </div>

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

