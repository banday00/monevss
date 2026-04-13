import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Dashboard Monitoring dan Evaluasi Satu Data Kota Bogor',
  description:
    'Dashboard monitoring internal untuk Portal Satu Data Kota Bogor. Pantau dataset, kualitas data, dan pengumpulan data per organisasi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout hanya menyediakan html/body.
  // Sidebar/header dikelola oleh (dashboard)/layout.tsx
  // Login page dikelola oleh (auth)/layout.tsx (tanpa sidebar)
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
