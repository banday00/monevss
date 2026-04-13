'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from '@/components/ui/DataTable';
import { formatDate, formatNumber, getScoreColor, getScoreLabel } from '@/lib/utils/format';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface KlasifikasiSummary {
  klasifikasi: string;
  total: number;
  approved: number;
  pct_approved: number;
  avg_score: number | null;
  total_views: number;
  total_downloads: number;
}

interface DatasetRow {
  id: number;
  name: string;
  slug: string | null;
  organisasi_name: string;
  klasifikasi: string;
  kategori: string;
  topik_name: string;
  validate: string | null;
  qs_score: number | null;
  qs_status: string | null;
  count_view: number;
  count_download: number;
  mdate: string;
  cdate: string;
}

interface TopikBreakdown {
  klasifikasi: string;
  topik_name: string;
  total: number;
}

/* ─── Demo data ──────────────────────────────────────────────────────────── */
const demoSummary: KlasifikasiSummary[] = [
  { klasifikasi: 'Terbuka', total: 312, approved: 285, pct_approved: 91.3, avg_score: 76.4, total_views: 48200, total_downloads: 12400 },
  { klasifikasi: 'Terbatas', total: 87, approved: 61, pct_approved: 70.1, avg_score: 62.8, total_views: 8750, total_downloads: 2100 },
  { klasifikasi: 'Rahasia', total: 24, approved: 14, pct_approved: 58.3, avg_score: 55.2, total_views: 1200, total_downloads: 320 },
  { klasifikasi: 'Sangat Rahasia', total: 6, approved: 3, pct_approved: 50.0, avg_score: 44.5, total_views: 180, total_downloads: 40 },
  { klasifikasi: 'Tidak Ditentukan', total: 41, approved: 28, pct_approved: 68.3, avg_score: null, total_views: 3200, total_downloads: 870 },
];

const demoDatasets: DatasetRow[] = [
  { id: 1, name: 'Jumlah Penduduk per Kecamatan', slug: 'jumlah-penduduk', organisasi_name: 'Dinas Dukcapil', klasifikasi: 'Terbuka', kategori: 'Statistik', topik_name: 'Kependudukan', validate: 'approve', qs_score: 100, qs_status: 'sangat_baik', count_view: 8421, count_download: 2100, mdate: '2026-03-10', cdate: '2025-01-15' },
  { id: 2, name: 'Data Puskesmas Kota Bogor', slug: 'data-puskesmas', organisasi_name: 'Dinas Kesehatan', klasifikasi: 'Terbuka', kategori: 'Pelayanan Publik', topik_name: 'Kesehatan', validate: 'approve', qs_score: 88, qs_status: 'sangat_baik', count_view: 5123, count_download: 1340, mdate: '2026-03-08', cdate: '2025-02-10' },
  { id: 3, name: 'Realisasi APBD 2025', slug: 'realisasi-apbd-2025', organisasi_name: 'BKAD', klasifikasi: 'Terbuka', kategori: 'Keuangan', topik_name: 'Keuangan Daerah', validate: 'approve', qs_score: 60, qs_status: 'baik', count_view: 3200, count_download: 980, mdate: '2026-04-01', cdate: '2025-03-01' },
  { id: 4, name: 'Data Kepegawaian Internal', slug: null, organisasi_name: 'BKPSDM', klasifikasi: 'Terbatas', kategori: 'SDM', topik_name: 'Kepegawaian', validate: 'approve', qs_score: 72, qs_status: 'baik', count_view: 420, count_download: 85, mdate: '2026-02-20', cdate: '2025-06-10' },
  { id: 5, name: 'Laporan Audit Internal 2025', slug: null, organisasi_name: 'Inspektorat', klasifikasi: 'Rahasia', kategori: 'Pengawasan', topik_name: 'Audit', validate: 'approve', qs_score: 55, qs_status: 'cukup', count_view: 120, count_download: 30, mdate: '2026-01-15', cdate: '2025-11-01' },
  { id: 6, name: 'Angka Partisipasi Kasar SD', slug: 'apk-sd', organisasi_name: 'Dinas Pendidikan', klasifikasi: 'Terbuka', kategori: 'Statistik', topik_name: 'Pendidikan', validate: 'approve', qs_score: 46, qs_status: 'cukup', count_view: 2150, count_download: 620, mdate: '2026-02-28', cdate: '2025-04-12' },
  { id: 7, name: 'Data Jalan Kota Bogor', slug: 'data-jalan', organisasi_name: 'Dinas PUPR', klasifikasi: 'Terbuka', kategori: 'Infrastruktur', topik_name: 'Infrastruktur', validate: 'approve', qs_score: 34, qs_status: 'perlu_diperbaiki', count_view: 1800, count_download: 450, mdate: '2026-01-20', cdate: '2025-05-05' },
  { id: 8, name: 'Rencana Strategis OPD', slug: null, organisasi_name: 'Bappeda', klasifikasi: 'Tidak Ditentukan', kategori: 'Perencanaan', topik_name: 'Perencanaan Daerah', validate: 'approve', qs_score: null, qs_status: null, count_view: 540, count_download: 120, mdate: '2025-12-31', cdate: '2025-07-22' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getKlasifikasiColor(k: string): string {
  switch (k.toLowerCase()) {
    case 'terbuka':
    case 'public':           return '#10b981'; // Emerald
    case 'terbatas':
    case 'internal':         return '#06b6d4'; // Cyan
    case 'rahasia':
    case 'private':
    case 'rahasia':          return '#f59e0b'; // Amber
    case 'sangat rahasia':   return '#f43f5e'; // Rose
    case 'tidak ditentukan': return '#8b5cf6'; // Violet
    default:                 return '#94a3b8'; // Slate
  }
}

function getValidateBadge(validate: string | null) {
  if (validate === 'approve') return { label: 'Approved', cls: 'badge-success' };
  if (validate === 'verification') return { label: 'Verifikasi', cls: 'badge-warning' };
  if (validate === 'new') return { label: 'Baru', cls: 'badge-info' };
  return { label: validate ?? '—', cls: 'badge-danger' };
}

function MiniDonut({ data }: { data: KlasifikasiSummary[] }) {
  const total = data.reduce((s, d) => s + d.total, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const slices = data.map((d) => {
    const pct = d.total / total;
    const start = cumulative;
    cumulative += pct;
    return { ...d, pct, start };
  });

  const radius = 36;
  const cx = 44, cy = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={88} height={88} viewBox="0 0 88 88">
      {slices.map((s, i) => {
        const strokeDash = s.pct * circumference;
        const strokeOffset = -s.start * circumference;
        const color = getKlasifikasiColor(s.klasifikasi);
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke={color}
            strokeWidth={12}
            strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
            strokeDashoffset={strokeOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            opacity={0.85}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={28} fill="var(--bg-card)" />
      <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text-primary)" fontSize="11" fontWeight="700">{total}</text>
      <text x={cx} y={cy + 9} textAnchor="middle" fill="var(--text-muted)" fontSize="8">dataset</text>
    </svg>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function KlasifikasiPage() {
  const [summary, setSummary]   = useState<KlasifikasiSummary[]>([]);
  const [datasets, setDatasets] = useState<DatasetRow[]>([]);
  const [topikBreakdown, setTopikBreakdown] = useState<TopikBreakdown[]>([]);
  const [loading, setLoading]   = useState(true);
  const [isDemo, setIsDemo]     = useState(false);

  // Filters
  const [selectedKlasifikasi, setSelectedKlasifikasi] = useState<string>('');
  const [filterValidate, setFilterValidate]           = useState<string>('');
  const [filterTopik, setFilterTopik]                 = useState<string>('');
  const [sortField, setSortField] = useState<'mdate' | 'qs_score' | 'count_view' | 'count_download'>('mdate');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedKlasifikasi
        ? `?klasifikasi=${encodeURIComponent(selectedKlasifikasi)}`
        : '';
      const res = await fetch(`/api/klasifikasi${params}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setSummary(json.summary);
      setDatasets(json.datasets);
      setTopikBreakdown(json.topikBreakdown);
      setIsDemo(false);
    } catch {
      setSummary(demoSummary);
      setDatasets(demoDatasets);
      setTopikBreakdown([]);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [selectedKlasifikasi]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Derived Stats ──────────────────────────────────────────────── */
  const totalDataset   = useMemo(() => summary.reduce((s, d) => s + d.total, 0), [summary]);
  const totalApproved  = useMemo(() => summary.reduce((s, d) => s + d.approved, 0), [summary]);
  const totalViews     = useMemo(() => summary.reduce((s, d) => s + d.total_views, 0), [summary]);
  const totalDownloads = useMemo(() => summary.reduce((s, d) => s + d.total_downloads, 0), [summary]);

  /* ── Filtered Datasets ──────────────────────────────────────────── */
  const topikOptions = useMemo(
    () => [...new Set(datasets.map((d) => d.topik_name))].sort(),
    [datasets]
  );

  const filteredDatasets = useMemo(() => {
    let d = datasets;
    if (selectedKlasifikasi) d = d.filter((r) => r.klasifikasi === selectedKlasifikasi);
    if (filterValidate)      d = d.filter((r) => r.validate === filterValidate);
    if (filterTopik)         d = d.filter((r) => r.topik_name === filterTopik);

    return [...d].sort((a, b) => {
      if (sortField === 'qs_score') return (b.qs_score ?? -1) - (a.qs_score ?? -1);
      if (sortField === 'count_view') return b.count_view - a.count_view;
      if (sortField === 'count_download') return b.count_download - a.count_download;
      return new Date(b.mdate).getTime() - new Date(a.mdate).getTime();
    });
  }, [datasets, selectedKlasifikasi, filterValidate, filterTopik, sortField]);

  /* ── Topik breakdown for selected klasifikasi ───────────────────── */
  const topikForSelected = useMemo(() => {
    if (!topikBreakdown.length) return [];
    const filtered = selectedKlasifikasi
      ? topikBreakdown.filter((t) => t.klasifikasi === selectedKlasifikasi)
      : topikBreakdown.reduce<TopikBreakdown[]>((acc, t) => {
          const ex = acc.find((x) => x.topik_name === t.topik_name);
          if (ex) ex.total += t.total;
          else acc.push({ ...t });
          return acc;
        }, []);
    return filtered.sort((a, b) => b.total - a.total).slice(0, 8);
  }, [topikBreakdown, selectedKlasifikasi]);

  /* ── Table columns ──────────────────────────────────────────────── */
  const columns = [
    {
      key: 'name',
      label: 'Dataset',
      width: '30%',
      render: (row: DatasetRow) => {
        const url = row.slug
          ? `https://satudata.kotabogor.go.id/dataset/${row.slug}`
          : null;
        return (
          <div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontWeight: 600, color: 'var(--primary-400)',
                  textDecoration: 'none', lineHeight: 1.4, display: 'block',
                  fontSize: 13,
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
              >
                {row.name}
              </a>
            ) : (
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, fontSize: 13 }}>
                {row.name}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.organisasi_name}</span>
              {row.topik_name && row.topik_name !== '—' && (
                <>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{row.topik_name}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'klasifikasi',
      label: 'Klasifikasi',
      width: '13%',
      render: (row: DatasetRow) => {
        const color = getKlasifikasiColor(row.klasifikasi);
        return (
          <span style={{
            display: 'inline-block', fontSize: 10, fontWeight: 700,
            padding: '3px 10px', borderRadius: 999,
            background: `${color}20`, color,
            border: `1px solid ${color}40`,
          }}>
            {row.klasifikasi}
          </span>
        );
      },
    },
    {
      key: 'validate',
      label: 'Status',
      width: '10%',
      render: (row: DatasetRow) => {
        const b = getValidateBadge(row.validate);
        return <span className={`badge ${b.cls}`}>{b.label}</span>;
      },
    },
    {
      key: 'qs_score',
      label: 'Kualitas',
      width: '12%',
      render: (row: DatasetRow) => {
        if (row.qs_score == null) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
        const color = getScoreColor(row.qs_score);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 4, background: 'var(--bg-input)', borderRadius: 999, minWidth: 36, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${row.qs_score}%`, background: color, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{row.qs_score}</span>
            </div>
            <span style={{ fontSize: 9, color, fontWeight: 600 }}>{getScoreLabel(row.qs_score)}</span>
          </div>
        );
      },
    },
    {
      key: 'count_view',
      label: '👁 Dilihat',
      width: '10%',
      render: (row: DatasetRow) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {formatNumber(row.count_view)}
        </span>
      ),
    },
    {
      key: 'count_download',
      label: '⬇ Unduh',
      width: '10%',
      render: (row: DatasetRow) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
          {formatNumber(row.count_download)}
        </span>
      ),
    },
    {
      key: 'mdate',
      label: 'Diperbarui',
      width: '12%',
      render: (row: DatasetRow) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(row.mdate)}</span>
      ),
    },
  ];

  /* ─── Render ─────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🏷️ Klasifikasi Dataset</h1>
          <p className="page-subtitle">
            Distribusi dan analisis dataset berdasarkan tingkat klasifikasi data
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

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>🏷️</div>
          </div>
          <div className="stat-card-value">{loading ? '—' : totalDataset}</div>
          <div className="stat-card-label">Total Dataset</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>✅</div>
          </div>
          <div className="stat-card-value" style={{ color: '#10b981' }}>{loading ? '—' : totalApproved}</div>
          <div className="stat-card-label">Dataset Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>👁️</div>
          </div>
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>{loading ? '—' : formatNumber(totalViews)}</div>
          <div className="stat-card-label">Total Dilihat</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>⬇️</div>
          </div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>{loading ? '—' : formatNumber(totalDownloads)}</div>
          <div className="stat-card-label">Total Diunduh</div>
        </div>
      </div>

      {/* Main Grid: Donut + Summary cards + Topik Breakdown */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, marginBottom: 24 }}>
          {/* Donut + Legend */}
          <div className="card shadow-premium" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <h3 className="card-title">Distribusi Klasifikasi</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div className="animate-scale-in">
                <MiniDonut data={summary} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {summary.map((s) => {
                  const color = getKlasifikasiColor(s.klasifikasi);
                  const pct = totalDataset > 0 ? Math.round((s.total / totalDataset) * 1000) / 10 : 0;
                  const isSelected = selectedKlasifikasi === s.klasifikasi;
                  return (
                    <button
                      key={s.klasifikasi}
                      onClick={() => setSelectedKlasifikasi(isSelected ? '' : s.klasifikasi)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: isSelected ? `${color}15` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? color : 'var(--border-subtle)'}`,
                        borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', textAlign: 'left', width: '100%',
                      }}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = color;
                          e.currentTarget.style.background = `${color}08`;
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--border-subtle)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }
                      }}
                    >
                      <div style={{ width: 12, height: 12, borderRadius: 4, background: color, flexShrink: 0, boxShadow: `0 0 8px ${color}60` }} />
                      <span style={{ flex: 1, fontSize: 13, color: isSelected ? color : 'var(--text-primary)', fontWeight: isSelected ? 700 : 500 }}>
                        {s.klasifikasi}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? color : 'var(--text-primary)' }}>{s.total}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{pct}%</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {selectedKlasifikasi && (
              <button
                onClick={() => setSelectedKlasifikasi('')}
                style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  color: '#f43f5e', borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, width: '100%', marginTop: 8,
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              >
                ✕ Bersihkan Filter
              </button>
            )}
          </div>

          {/* Klasifikasi Detail Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {summary.map((s, idx) => {
              const color = getKlasifikasiColor(s.klasifikasi);
              const isSelected = selectedKlasifikasi === s.klasifikasi;
              return (
                <button
                  key={s.klasifikasi}
                  onClick={() => setSelectedKlasifikasi(isSelected ? '' : s.klasifikasi)}
                  className={`animate-fade-in stagger-${idx + 1}`}
                  style={{
                    background: isSelected 
                      ? `linear-gradient(135deg, ${color}15, ${color}08)` 
                      : 'var(--bg-card)',
                    border: `1px solid ${isSelected ? color : 'var(--border-subtle)'}`,
                    borderRadius: 16, padding: '16px 20px', cursor: 'pointer',
                    display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20,
                    alignItems: 'center', textAlign: 'left', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isSelected ? `0 10px 25px -5px ${color}25` : '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 10px 20px -5px ${color}15`;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)';
                    }
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: color, boxShadow: `0 0 8px ${color}` }} />
                      <span style={{ fontSize: 14, fontWeight: 800, color: isSelected ? color : 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                        {s.klasifikasi}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Volume:
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{s.total}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>datasets</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)' }}>
                      <div style={{
                        height: '100%', width: `${s.pct_approved}%`,
                        background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                        borderRadius: 999, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, textAlign: 'center' }}>
                    <div className="stat-mini">
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981' }}>{s.approved}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Approved</div>
                    </div>
                    <div className="stat-mini">
                      <div style={{ fontSize: 16, fontWeight: 800, color }}>{s.pct_approved.toFixed(1)}%</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Coverage</div>
                    </div>
                    <div className="stat-mini">
                      <div style={{ 
                        fontSize: 16, fontWeight: 800, 
                        color: s.avg_score ? getScoreColor(s.avg_score) : 'var(--text-muted)' 
                      }}>
                        {s.avg_score?.toFixed(1) ?? '—'}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Quality</div>
                    </div>
                    <div className="stat-mini">
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6' }}>{formatNumber(s.total_views)}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Views</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Topik Breakdown (if available) */}
      {!loading && topikForSelected.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3 className="card-title">
              Top Topik — {selectedKlasifikasi || 'Semua Klasifikasi'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {topikForSelected.map((t) => {
              const maxTotal = topikForSelected[0]?.total || 1;
              const pct = Math.round((t.total / maxTotal) * 100);
              return (
                <div
                  key={t.topik_name}
                  style={{
                    flex: '1 1 180px', background: 'var(--bg-input)',
                    borderRadius: 10, padding: '10px 14px',
                    border: '1px solid var(--bg-card-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{t.topik_name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-400)' }}>{t.total}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--bg-card-border)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary-500)', borderRadius: 999 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dataset Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3 className="card-title">
            📋 Daftar Dataset
            {selectedKlasifikasi && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 700,
                padding: '2px 10px', borderRadius: 999,
                background: `${getKlasifikasiColor(selectedKlasifikasi)}20`,
                color: getKlasifikasiColor(selectedKlasifikasi),
              }}>
                {selectedKlasifikasi}
              </span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Filter validate */}
            <select
              value={filterValidate}
              onChange={(e) => setFilterValidate(e.target.value)}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', borderRadius: 8, padding: '5px 10px', fontSize: 12,
              }}
            >
              <option value="">Semua Status</option>
              <option value="approve">Approved</option>
              <option value="verification">Verifikasi</option>
              <option value="new">Baru</option>
            </select>
            {/* Filter topik */}
            <select
              value={filterTopik}
              onChange={(e) => setFilterTopik(e.target.value)}
              style={{
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)', borderRadius: 8, padding: '5px 10px', fontSize: 12,
                maxWidth: 200,
              }}
            >
              <option value="">Semua Topik</option>
              {topikOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {/* Sort */}
            <div style={{ display: 'flex', gap: 4 }}>
              {([
                { value: 'mdate', label: 'Terbaru' },
                { value: 'qs_score', label: 'Kualitas' },
                { value: 'count_view', label: 'Dilihat' },
                { value: 'count_download', label: 'Unduh' },
              ] as const).map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSortField(s.value)}
                  style={{
                    padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                    background: sortField === s.value ? 'rgba(139,92,246,0.2)' : 'var(--bg-input)',
                    border: `1px solid ${sortField === s.value ? '#8b5cf6' : 'var(--border-subtle)'}`,
                    color: sortField === s.value ? '#8b5cf6' : 'var(--text-secondary)',
                    fontWeight: sortField === s.value ? 700 : 400, transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div>{[...Array(6)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '0 2px' }}>
              Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filteredDatasets.length}</strong> dari{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{datasets.length}</strong> dataset
            </div>
            <DataTable<DatasetRow>
              columns={columns}
              data={filteredDatasets}
              pageSize={20}
              searchPlaceholder="Cari dataset, organisasi, atau topik..."
              emptyMessage="Tidak ada dataset yang cocok dengan filter"
            />
          </>
        )}
      </div>
    </div>
  );
}
