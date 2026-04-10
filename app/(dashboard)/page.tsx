'use client';

import { useEffect, useState, useCallback } from 'react';
import TrendChart from '@/components/charts/TrendChart';
import TopOrgChart from '@/components/charts/TopOrgChart';
import { formatNumber, formatPercentage, formatRelativeTime } from '@/lib/utils/format';

interface OverviewData {
  stats: {
    totalDatasets: number;
    totalOrganisasi: number;
    totalTopik: number;
    datasetsThisMonth: number;
    datasetsUpdatedThisMonth: number;
    avgQualityScore: number;
    priorityCoverage: number;
    totalViews: number;
    totalDownloads: number;
    totalPriority: number;
    fulfilledPriority: number;
  };
  trend: { month: string; count: number }[];
  topOrganisasi: {
    id: number;
    name: string;
    count_dataset_all: number;
    count_dataset_public: number;
  }[];
  recentActivities: {
    id: number;
    dataset_id: number;
    dataset_name: string;
    type: string;
    notes: string;
    username: string;
    cdate: string;
    organisasi_name: string;
  }[];
  popularDatasets: {
    id: number;
    name: string;
    organisasi_name: string;
    total_views: number;
    total_downloads: number;
  }[];
}

// Demo data for when DB is not connected
const demoData: OverviewData = {
  stats: {
    totalDatasets: 1247,
    totalOrganisasi: 42,
    totalTopik: 18,
    datasetsThisMonth: 23,
    datasetsUpdatedThisMonth: 67,
    avgQualityScore: 72.5,
    priorityCoverage: 68.3,
    totalViews: 45820,
    totalDownloads: 12340,
    totalPriority: 154,
    fulfilledPriority: 105,
  },
  trend: [
    { month: '2025-05', count: 15 },
    { month: '2025-06', count: 22 },
    { month: '2025-07', count: 18 },
    { month: '2025-08', count: 31 },
    { month: '2025-09', count: 25 },
    { month: '2025-10', count: 28 },
    { month: '2025-11', count: 35 },
    { month: '2025-12', count: 19 },
    { month: '2026-01', count: 42 },
    { month: '2026-02', count: 38 },
    { month: '2026-03', count: 29 },
    { month: '2026-04', count: 23 },
  ],
  topOrganisasi: [
    { id: 1, name: 'Dinas Kesehatan', count_dataset_all: 156, count_dataset_public: 120 },
    { id: 2, name: 'Dinas Pendidikan', count_dataset_all: 134, count_dataset_public: 98 },
    { id: 3, name: 'Badan Keuangan dan Aset Daerah', count_dataset_all: 112, count_dataset_public: 89 },
    { id: 4, name: 'Dinas Kependudukan dan Pencatatan Sipil', count_dataset_all: 98, count_dataset_public: 76 },
    { id: 5, name: 'Badan Perencanaan Pembangunan Daerah', count_dataset_all: 87, count_dataset_public: 65 },
  ],
  recentActivities: [
    { id: 1, dataset_id: 101, dataset_name: 'Jumlah Penduduk per Kecamatan 2026', type: 'create', notes: 'Dataset baru ditambahkan', username: 'admin_dukcapil', cdate: new Date(Date.now() - 1800000).toISOString(), organisasi_name: 'Dinas Kependudukan dan Pencatatan Sipil' },
    { id: 2, dataset_id: 102, dataset_name: 'Data Puskesmas Kota Bogor', type: 'update', notes: 'Update data Q1 2026', username: 'admin_dinkes', cdate: new Date(Date.now() - 7200000).toISOString(), organisasi_name: 'Dinas Kesehatan' },
    { id: 3, dataset_id: 103, dataset_name: 'Realisasi APBD 2025', type: 'update', notes: 'Finalisasi data', username: 'admin_bkad', cdate: new Date(Date.now() - 14400000).toISOString(), organisasi_name: 'Badan Keuangan dan Aset Daerah' },
    { id: 4, dataset_id: 104, dataset_name: 'Angka Partisipasi Kasar SD', type: 'create', notes: 'Dataset baru', username: 'admin_dindik', cdate: new Date(Date.now() - 28800000).toISOString(), organisasi_name: 'Dinas Pendidikan' },
    { id: 5, dataset_id: 105, dataset_name: 'Indeks Pembangunan Manusia', type: 'update', notes: 'Revisi data 2024', username: 'admin_bappeda', cdate: new Date(Date.now() - 43200000).toISOString(), organisasi_name: 'Badan Perencanaan Pembangunan Daerah' },
    { id: 6, dataset_id: 106, dataset_name: 'Data Jalan Kota Bogor', type: 'create', notes: 'Dataset infrastruktur baru', username: 'admin_pupr', cdate: new Date(Date.now() - 86400000).toISOString(), organisasi_name: 'Dinas Pekerjaan Umum' },
    { id: 7, dataset_id: 107, dataset_name: 'Produksi Sampah per Kecamatan', type: 'update', notes: 'Update bulanan', username: 'admin_dlh', cdate: new Date(Date.now() - 129600000).toISOString(), organisasi_name: 'Dinas Lingkungan Hidup' },
    { id: 8, dataset_id: 108, dataset_name: 'Data UMKM Kota Bogor', type: 'create', notes: 'Pendataan baru', username: 'admin_diskop', cdate: new Date(Date.now() - 172800000).toISOString(), organisasi_name: 'Dinas Koperasi dan UKM' },
  ],
  popularDatasets: [
    { id: 1, name: 'Jumlah Penduduk per Kecamatan', organisasi_name: 'Dinas Kependudukan', total_views: 8420, total_downloads: 2310 },
    { id: 2, name: 'Data Puskesmas Kota Bogor', organisasi_name: 'Dinas Kesehatan', total_views: 6230, total_downloads: 1820 },
    { id: 3, name: 'Realisasi APBD', organisasi_name: 'BKAD', total_views: 5100, total_downloads: 1540 },
    { id: 4, name: 'Angka Partisipasi Sekolah', organisasi_name: 'Dinas Pendidikan', total_views: 4250, total_downloads: 980 },
    { id: 5, name: 'Indeks Pembangunan Manusia', organisasi_name: 'Bappeda', total_views: 3890, total_downloads: 870 },
  ],
};

function getActivityDotClass(type: string): string {
  switch (type) {
    case 'create':
    case 'new':
    case 'verification': return 'create';
    case 'update':
    case 'change':
    case 'edit':
    case 'approve': return 'update';
    case 'delete':
    case 'reject': return 'delete';
    default: return 'update';
  }
}

function getActivityLabel(type: string): string {
  switch (type) {
    case 'create':
    case 'new': return 'menambahkan';
    case 'update':
    case 'change':
    case 'edit': return 'memperbarui';
    case 'approve': return 'menyetujui';
    case 'verification': return 'memverifikasi';
    case 'delete': return 'menghapus';
    case 'reject': return 'menolak';
    default: return 'mengubah';
  }
}

function getActivityBadge(type: string): { label: string; color: string } {
  switch (type) {
    case 'create':
    case 'new': return { label: 'Baru', color: '#10b981' };
    case 'update':
    case 'change':
    case 'edit': return { label: 'Update', color: '#3b82f6' };
    case 'approve': return { label: 'Approve', color: '#8b5cf6' };
    case 'verification': return { label: 'Verifikasi', color: '#06b6d4' };
    case 'delete': return { label: 'Hapus', color: '#ef4444' };
    case 'reject': return { label: 'Tolak', color: '#f59e0b' };
    default: return { label: type, color: '#64748b' };
  }
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/overview');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setData(json);
      setIsDemo(false);
    } catch {
      // Use demo data when DB is not connected
      setData(demoData);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Beranda</h1>
          <p className="page-subtitle">Overview portal Satu Data Kota Bogor</p>
        </div>
        <div className="stats-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-stat" />
          ))}
        </div>
        <div className="dashboard-grid">
          <div className="skeleton skeleton-chart" />
          <div className="skeleton skeleton-chart" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, trend, topOrganisasi, recentActivities, popularDatasets } = data;

  const statCards = [
    {
      icon: '📊',
      label: 'Total Dataset',
      value: formatNumber(stats.totalDatasets),
      accent: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
    },
    {
      icon: '🏢',
      label: 'Organisasi Aktif',
      value: formatNumber(stats.totalOrganisasi),
      accent: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
    },
    {
      icon: '📁',
      label: 'Topik Data',
      value: formatNumber(stats.totalTopik),
      accent: '#8b5cf6',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      icon: '🆕',
      label: 'Dataset Baru (Bulan Ini)',
      value: formatNumber(stats.datasetsThisMonth),
      accent: '#06b6d4',
      bg: 'rgba(6,182,212,0.12)',
    },
    {
      icon: '🔄',
      label: 'Dataset Diupdate (Bulan Ini)',
      value: formatNumber(stats.datasetsUpdatedThisMonth),
      accent: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: '🎯',
      label: 'Coverage Data Prioritas',
      value: formatPercentage(stats.priorityCoverage),
      accent: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
    },
    {
      icon: '⭐',
      label: 'Rata-rata Skor Kualitas',
      value: stats.avgQualityScore.toFixed(1),
      accent: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
    },
    {
      icon: '👁️',
      label: 'Total Views',
      value: formatNumber(stats.totalViews),
      accent: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
    },
    {
      icon: '🎯',
      label: 'Total Data Prioritas',
      value: formatNumber(stats.totalPriority),
      accent: '#ec4899',
      bg: 'rgba(236,72,153,0.12)',
    },
    {
      icon: '✅',
      label: 'Data Prioritas Terpenuhi',
      value: formatNumber(stats.fulfilledPriority),
      accent: '#10b981',
      bg: 'rgba(16,185,129,0.12)',
      sub: stats.totalPriority > 0
        ? `${formatPercentage((stats.fulfilledPriority / stats.totalPriority) * 100)} terpenuhi`
        : undefined,
    },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Beranda</h1>
          <p className="page-subtitle">
            Overview portal Satu Data Kota Bogor
            {isDemo && (
              <span style={{
                marginLeft: 12,
                padding: '2px 10px',
                background: 'rgba(245,158,11,0.15)',
                color: '#f59e0b',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 600,
              }}>
                ⚠️ Mode Demo — Database belum terhubung
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: 'var(--primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(16,185,129,0.2)'
          }}
          onMouseOver={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-600)';
          }}
          onMouseOut={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = 'var(--primary-500)';
          }}
        >
          <span style={{ 
            display: 'inline-block', 
            animation: loading ? 'spin 1s linear infinite' : 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
              <path d="M16 21v-5h5"></path>
            </svg>
          </span>
          {loading ? 'Memuat Data...' : 'Refresh Data'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`stat-card animate-fade-in stagger-${i + 1}`}
            style={{ '--stat-accent': card.accent, '--stat-bg': card.bg } as React.CSSProperties}
          >
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: card.bg }}>
                {card.icon}
              </div>
            </div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
            {'sub' in card && card.sub && (
              <div style={{ fontSize: 11, color: card.accent, fontWeight: 600, marginTop: 2 }}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="dashboard-grid">
        {/* Trend Chart */}
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">Trend Dataset Bulanan</h3>
              <p className="card-subtitle">Dataset baru per bulan (12 bulan terakhir)</p>
            </div>
          </div>
          <TrendChart data={trend} />
        </div>

        {/* Top Org Chart */}
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">Top 5 Organisasi</h3>
              <p className="card-subtitle">Berdasarkan jumlah dataset</p>
            </div>
          </div>
          <TopOrgChart data={topOrganisasi} />
        </div>
      </div>

      {/* Activity + Popular */}
      <div className="dashboard-grid">
        {/* Recent Activities */}
        <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <h3 className="card-title">Aktivitas Terbaru</h3>
              <p className="card-subtitle">20 aktivitas terakhir pada dataset</p>
            </div>
          </div>
          <div className="activity-list" style={{ maxHeight: 600, flex: 1 }}>
            {recentActivities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">Belum ada aktivitas</div>
              </div>
            ) : (
              recentActivities.map((activity) => {
                const badge = getActivityBadge(activity.type);
                return (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-dot ${getActivityDotClass(activity.type)}`} />
                    <div className="activity-content">
                      <div className="activity-text">
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 600,
                          padding: '1px 7px', borderRadius: 20, marginRight: 6,
                          background: `${badge.color}20`, color: badge.color,
                        }}>{badge.label}</span>
                        <strong>{activity.username}</strong> {getActivityLabel(activity.type)}{' '}
                        <strong>{activity.dataset_name}</strong>
                      </div>
                      {activity.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 2 }}>
                          {activity.notes}
                        </div>
                      )}
                      <div className="activity-meta">
                        <span>{activity.organisasi_name}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(activity.cdate)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Popular Datasets */}
        <div className="card animate-fade-in">
          <div className="card-header">
            <div>
              <h3 className="card-title">Dataset Terpopuler</h3>
              <p className="card-subtitle">Berdasarkan jumlah views</p>
            </div>
          </div>
          <div className="rank-list">
            {popularDatasets.map((ds, i) => (
              <div key={ds.id} className="rank-item">
                <div className={`rank-number ${i < 3 ? 'top' : ''}`}>{i + 1}</div>
                <div className="rank-info">
                  <div className="rank-name">{ds.name}</div>
                  <div className="rank-detail">{ds.organisasi_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="rank-value">{formatNumber(ds.total_views)}</div>
                  <div className="rank-detail">👁️ views</div>
                </div>
              </div>
            ))}
          </div>

          {/* Downloads Table */}
          <div style={{ marginTop: 24 }}>
            <h4 className="card-title" style={{ marginBottom: 12 }}>Download Terbanyak</h4>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dataset</th>
                    <th style={{ textAlign: 'right' }}>Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {popularDatasets.map((ds, i) => (
                    <tr key={ds.id}>
                      <td>{i + 1}</td>
                      <td>{ds.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--chart-2)' }}>
                        {formatNumber(ds.total_downloads)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
