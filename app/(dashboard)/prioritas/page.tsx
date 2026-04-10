'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import { formatDate, formatPercentage } from '@/lib/utils/format';

interface PriorityItem {
  id: number;
  organization_id: number;
  organisasi_name: string;
  dataset_id: number | null;
  dataset_name: string | null;
  name: string;
  year: number;
  is_active: boolean;
  cdate: string;
  mdate: string;
}

interface GroupedOrg {
  organisasi_name: string;
  items: PriorityItem[];
  total: number;
  fulfilled: number;
  percentage: number;
}

interface PrioritySummary {
  total: number;
  fulfilled: number;
  unfulfilled: number;
  percentage: number;
}

// Demo data
const demoGrouped: GroupedOrg[] = [
  { organisasi_name: 'Dinas Kesehatan', items: [], total: 25, fulfilled: 22, percentage: 88.0 },
  { organisasi_name: 'Dinas Pendidikan', items: [], total: 20, fulfilled: 17, percentage: 85.0 },
  { organisasi_name: 'BKAD', items: [], total: 18, fulfilled: 14, percentage: 77.8 },
  { organisasi_name: 'Dinas Dukcapil', items: [], total: 15, fulfilled: 11, percentage: 73.3 },
  { organisasi_name: 'Bappeda', items: [], total: 22, fulfilled: 16, percentage: 72.7 },
  { organisasi_name: 'Dinas PUPR', items: [], total: 12, fulfilled: 8, percentage: 66.7 },
  { organisasi_name: 'Dinas LH', items: [], total: 10, fulfilled: 6, percentage: 60.0 },
  { organisasi_name: 'Dinas Sosial', items: [], total: 14, fulfilled: 8, percentage: 57.1 },
  { organisasi_name: 'Disperindag', items: [], total: 8, fulfilled: 4, percentage: 50.0 },
  { organisasi_name: 'Disnaker', items: [], total: 10, fulfilled: 4, percentage: 40.0 },
];

const demoAll: PriorityItem[] = [
  { id: 1, organization_id: 1, organisasi_name: 'Dinas Kesehatan', dataset_id: 101, dataset_name: 'Jumlah Puskesmas', name: 'Data Puskesmas per Kecamatan', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-03-10' },
  { id: 2, organization_id: 1, organisasi_name: 'Dinas Kesehatan', dataset_id: 102, dataset_name: 'Data Imunisasi', name: 'Cakupan Imunisasi Dasar Lengkap', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-03-10' },
  { id: 3, organization_id: 1, organisasi_name: 'Dinas Kesehatan', dataset_id: null, dataset_name: null, name: 'Angka Kematian Ibu', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-01-15' },
  { id: 4, organization_id: 2, organisasi_name: 'Dinas Pendidikan', dataset_id: 201, dataset_name: 'APK SD/MI', name: 'Angka Partisipasi Kasar SD', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-02-20' },
  { id: 5, organization_id: 2, organisasi_name: 'Dinas Pendidikan', dataset_id: null, dataset_name: null, name: 'Rasio Guru per Murid SMP', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-01-15' },
  { id: 6, organization_id: 3, organisasi_name: 'BKAD', dataset_id: 301, dataset_name: 'Realisasi APBD', name: 'Realisasi Pendapatan Daerah', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-04-01' },
  { id: 7, organization_id: 3, organisasi_name: 'BKAD', dataset_id: null, dataset_name: null, name: 'Aset Daerah per Kategori', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-01-15' },
  { id: 8, organization_id: 4, organisasi_name: 'Dinas Dukcapil', dataset_id: 401, dataset_name: 'Jumlah Penduduk', name: 'Data Penduduk per Kecamatan', year: 2026, is_active: true, cdate: '2026-01-15', mdate: '2026-03-15' },
];

function getProgressColor(pct: number): string {
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

type ViewMode = 'grouped' | 'detail';

export default function PrioritasPage() {
  const [grouped, setGrouped] = useState<GroupedOrg[]>([]);
  const [allItems, setAllItems] = useState<PriorityItem[]>([]);
  const [summary, setSummary] = useState<PrioritySummary>({ total: 0, fulfilled: 0, unfulfilled: 0, percentage: 0 });
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).reverse();
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear - 1);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prioritas?year=${selectedYear}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setGrouped(json.grouped);
      setAllItems(json.all);
      setSummary(json.summary);
      setIsDemo(false);
    } catch {
      setGrouped(demoGrouped);
      setAllItems(demoAll);
      const t = demoGrouped.reduce((s, g) => s + g.total, 0);
      const f = demoGrouped.reduce((s, g) => s + g.fulfilled, 0);
      setSummary({ total: t, fulfilled: f, unfulfilled: t - f, percentage: Math.round((f / t) * 1000) / 10 });
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const detailColumns = [
    {
      key: 'name',
      label: 'Nama Data Prioritas',
      width: '30%',
      render: (row: PriorityItem) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</span>
      ),
    },
    {
      key: 'organisasi_name',
      label: 'Organisasi',
      width: '22%',
      render: (row: PriorityItem) => (
        <span style={{ fontSize: 12 }}>{row.organisasi_name}</span>
      ),
    },
    {
      key: 'dataset_name',
      label: 'Dataset Terkait',
      width: '25%',
      render: (row: PriorityItem) => (
        row.dataset_name ? (
          <span style={{ color: 'var(--primary-400)', fontWeight: 500 }}>{row.dataset_name}</span>
        ) : (
          <span className="badge badge-danger">Belum ada dataset</span>
        )
      ),
    },
    {
      key: 'dataset_id',
      label: 'Status',
      width: '10%',
      render: (row: PriorityItem) => (
        <span className={`badge ${row.dataset_id ? 'badge-success' : 'badge-danger'}`}>
          {row.dataset_id ? '✓ Terpenuhi' : '✗ Belum'}
        </span>
      ),
    },
    {
      key: 'mdate',
      label: 'Update',
      width: '13%',
      render: (row: PriorityItem) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(row.mdate)}</span>
      ),
    },
  ];

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">🎯 Data Prioritas</h1>
          <p className="page-subtitle">Pemenuhan data prioritas per organisasi per tahun</p>
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-stat" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🎯 Data Prioritas</h1>
          <p className="page-subtitle">
            Pemenuhan data prioritas per organisasi per tahun
            {isDemo && (
              <span style={{ marginLeft: 12, padding: '2px 10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                ⚠️ Mode Demo
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

      {/* Year + View Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Tahun:</label>
          <div className="tabs" style={{ marginBottom: 0 }}>
            {years.map((y) => (
              <button key={y} className={`tab ${selectedYear === y ? 'active' : ''}`} onClick={() => setSelectedYear(y)}>{y}</button>
            ))}
          </div>
        </div>
        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${viewMode === 'grouped' ? 'active' : ''}`} onClick={() => setViewMode('grouped')}>📊 Per Organisasi</button>
          <button className={`tab ${viewMode === 'detail' ? 'active' : ''}`} onClick={() => setViewMode('detail')}>📋 Detail Semua</button>
        </div>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>🎯</div></div><div className="stat-card-value">{summary.total}</div><div className="stat-card-label">Total Prioritas</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>✅</div></div><div className="stat-card-value" style={{ color: 'var(--status-success)' }}>{summary.fulfilled}</div><div className="stat-card-label">Terpenuhi</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>❌</div></div><div className="stat-card-value" style={{ color: 'var(--status-danger)' }}>{summary.unfulfilled}</div><div className="stat-card-label">Belum Terpenuhi</div></div>
        <div className="stat-card"><div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(236,72,153,0.12)' }}>📈</div></div><div className="stat-card-value" style={{ color: getProgressColor(summary.percentage) }}>{formatPercentage(summary.percentage)}</div><div className="stat-card-label">Coverage</div></div>
      </div>

      {/* Content */}
      {viewMode === 'grouped' ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Progress per Organisasi — Tahun {selectedYear}</h3>
          </div>
          <div className="org-progress-list">
            {grouped.map((org) => (
              <div key={org.organisasi_name} className="org-progress-item">
                <div className="org-progress-header">
                  <span className="org-progress-name">{org.organisasi_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="org-progress-stats">{org.fulfilled}/{org.total}</span>
                    <span className="org-progress-pct" style={{ color: getProgressColor(org.percentage) }}>{formatPercentage(org.percentage)}</span>
                  </div>
                </div>
                <div className="org-progress-bar">
                  <div className="org-progress-fill" style={{ width: `${Math.min(org.percentage, 100)}%`, background: `linear-gradient(90deg, ${getProgressColor(org.percentage)}, ${getProgressColor(org.percentage)}80)` }} />
                </div>
              </div>
            ))}
            {grouped.length === 0 && (
              <div className="empty-state"><div className="empty-state-icon">📭</div><div className="empty-state-title">Belum ada data prioritas untuk tahun {selectedYear}</div></div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <DataTable<PriorityItem>
            columns={detailColumns}
            data={allItems}
            pageSize={20}
            searchPlaceholder="Cari nama data prioritas atau organisasi..."
            emptyMessage="Tidak ada data prioritas"
          />
        </div>
      )}
    </div>
  );
}
