import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/lib/auth/config';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export const metadata: Metadata = {
  title: 'Dashboard Monitoring — Satu Data Kota Bogor',
  description:
    'Dashboard monitoring internal untuk Portal Satu Data Kota Bogor. Pantau dataset, kualitas data, dan pengumpulan data per organisasi.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware sudah memastikan:
  //   - Unauthenticated → hanya bisa akses /login
  //   - Authenticated   → redirect keluar dari /login ke /
  // Layout tinggal cek session untuk menentukan apakah perlu render sidebar.
  const session = await auth();

  return (
    <html lang="id">
      <body>
        {session ? (
          // Authenticated: tampilkan full dashboard layout
          <div className="app-layout">
            <Sidebar />
            <div className="main-content">
              <Header />
              <main className="page-content">{children}</main>
            </div>
          </div>
        ) : (
          // Unauthenticated: tampilkan halaman login tanpa sidebar/header
          children
        )}
      </body>
    </html>
  );
}
