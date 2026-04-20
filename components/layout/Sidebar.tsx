'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    section: 'Utama',
    items: [
      { href: '/', icon: '🏠', label: 'Beranda', id: 'nav-home' },
      { href: '/datasets', icon: '📊', label: 'Dataset', id: 'nav-datasets' },
      { href: '/pengumpulan', icon: '📈', label: 'Pengumpulan Data', id: 'nav-pengumpulan' },
    ],
  },
  {
    section: 'Analisis',
    items: [
      { href: '/prioritas', icon: '🎯', label: 'Data Prioritas', id: 'nav-prioritas' },
      { href: '/klasifikasi', icon: '🏷️', label: 'Klasifikasi', id: 'nav-klasifikasi' },
      { href: '/kualitas', icon: '⭐', label: 'Kualitas Data', id: 'nav-kualitas' },
    ],
  },
  {
    section: 'Referensi',
    items: [
      { href: '/organisasi', icon: '🏢', label: 'Organisasi', id: 'nav-organisasi' },
      { href: '/bigdata', icon: '📦', label: 'BigData Explorer', id: 'nav-bigdata' },
      { href: '/diskontinuasi', icon: '🔔', label: 'Diskontinuasi', id: 'nav-diskontinuasi' },
      { href: '/laporan', icon: '📋', label: 'Laporan', id: 'nav-laporan' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Image 
            src="/logo_kota_bogor.png" 
            alt="Logo Kota Bogor" 
            width={32} 
            height={32}
            priority
            unoptimized
          />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">SATU DATA</span>
          <span className="sidebar-logo-subtitle">Monitoring dan Evaluasi</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                className={`sidebar-link ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

    </aside>
  );
}
