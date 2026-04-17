import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/layout/ThemeProvider';

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
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t)}else if(window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
