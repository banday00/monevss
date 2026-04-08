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
  const session = await auth();
  const isLoginPage =
    typeof children === 'object' && children !== null;

  return (
    <html lang="id">
      <body>
        {session ? (
          <div className="app-layout">
            <Sidebar />
            <div className="main-content">
              <Header />
              <main className="page-content">{children}</main>
            </div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
