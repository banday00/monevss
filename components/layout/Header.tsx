'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Header() {
  const [nextRefresh, setNextRefresh] = useState(300);

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
