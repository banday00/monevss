'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import { formatDate, formatPercentage } from '@/lib/utils/format';
import DatasetSearchModal from '@/components/prioritas/DatasetSearchModal';

interface PriorityItem {
  id: string;
  organization_id: number | string | null;
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
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(currentYear - 1);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [mappingItem, setMappingItem] = useState<PriorityItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/prioritas?year=${selectedYear}`);
      if (!res.ok) throw new Error(`Gagal memuat data (HTTP ${res.status})`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setGrouped(json.grouped);
      setAllItems(json.all);
      setSummary(json.summary);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data';
      setError(message);
      setGrouped([]);
      setAllItems([]);
      setSummary({ total: 0, fulfilled: 0, unfulfilled: 0, percentage: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleMapped = useCallback(
    (priorityId: string, datasetId: number | null, datasetName: string | null) => {
      setAllItems((prev) =>
        prev.map((item) =>
          item.id === priorityId
            ? { ...item, dataset_id: datasetId, dataset_name: datasetName }
            : item
        )
      );
    },
    []
  );

  const detailColumns = [
    {
      key: 'name',
      label: 'Nama Data Prioritas',
      width: '28%',
      render: (row: PriorityItem) => (
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{row.name}</span>
      ),
    },
    {
      key: 'organisasi_name',
      label: 'Organisasi',
      width: '20%',
      render: (row: PriorityItem) => (
        <span style={{ fontSize: 12 }}>{row.organisasi_name}</span>
      ),
    },
    {
      key: 'dataset_name',
      label: 'Dataset Terkait',
      width: '22%',
      render: (row: PriorityItem) => (
        row.dataset_name ? (
          <span style={{ color: 'var(--dataset-link-color)', fontWeight: 500 }}>{row.dataset_name}</span>
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
      width: '12%',
      render: (row: PriorityItem) => (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(row.mdate)}</span>
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '8%',
      render: (row: PriorityItem) => (
        <button
          onClick={() => setMappingItem(row)}
          title="Cari & mapping dataset"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary-500)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary-500)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(16,185,129,0.08)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </button>
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
          <p className="page-subtitle">Pemenuhan data prioritas per organisasi per tahun</p>
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

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: '14px 20px',
          marginBottom: 20,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#ef4444',
          fontSize: 13,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Gagal Memuat Data</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{error}. Silakan klik tombol &quot;Refresh Data&quot; untuk mencoba kembali.</div>
          </div>
        </div>
      )}

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
            {grouped.length === 0 && !error && (
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

      {mappingItem && (
        <DatasetSearchModal
          item={mappingItem}
          onClose={() => setMappingItem(null)}
          onMapped={handleMapped}
        />
      )}
    </div>
  );
}
