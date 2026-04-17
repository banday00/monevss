'use client';

import { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import { getScoreColor, getScoreLabel, formatDate } from '@/lib/utils/format';
import type { QualityScore } from '@/lib/queries/kualitas';

const demoScores: QualityScore[] = [
  { id: '1', dataset_id: 101, dataset_name: 'Jumlah Penduduk per Kecamatan', dataset_slug: 'jumlah-penduduk-per-kecamatan', organisasi_name: 'Dinas Dukcapil', score: 100, status: 'sangat_baik', completeness: 100, conformity: 100, timeliness: 100, uniqueness: 100, consistency: 100, timestamp: '2026-03-01' },
  { id: '2', dataset_id: 102, dataset_name: 'Data Puskesmas Kota Bogor', dataset_slug: 'data-puskesmas-kota-bogor', organisasi_name: 'Dinas Kesehatan', score: 88, status: 'sangat_baik', completeness: 100, conformity: 80, timeliness: 80, uniqueness: 100, consistency: 80, timestamp: '2026-03-01' },
  { id: '3', dataset_id: 103, dataset_name: 'Realisasi APBD 2025', dataset_slug: 'realisasi-apbd-2025', organisasi_name: 'BKAD', score: 60, status: 'baik', completeness: 100, conformity: 60, timeliness: 60, uniqueness: 60, consistency: 20, timestamp: '2026-03-01' },
  { id: '4', dataset_id: 104, dataset_name: 'Angka Partisipasi Kasar SD', dataset_slug: 'angka-partisipasi-kasar-sd', organisasi_name: 'Dinas Pendidikan', score: 46, status: 'cukup', completeness: 100, conformity: 80, timeliness: 0, uniqueness: 100, consistency: 0, timestamp: '2026-03-01' },
  { id: '5', dataset_id: 105, dataset_name: 'Data Jalan Kota Bogor', dataset_slug: 'data-jalan-kota-bogor', organisasi_name: 'Dinas PUPR', score: 34, status: 'perlu_diperbaiki', completeness: 100, conformity: 80, timeliness: 0, uniqueness: 0, consistency: 0, timestamp: '2026-03-01' },
];

function ScoreBar({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>;
  const color = getScoreColor(value);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, background: 'var(--bg-input)', borderRadius: 999, overflow: 'hidden', minWidth: 40 }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 999 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

type SortField = 'score' | 'completeness' | 'conformity' | 'timeliness' | 'uniqueness' | 'consistency';

export default function KualitasPage() {
  const [data, setData] = useState<QualityScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>('score');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterOrg, setFilterOrg] = useState<string>('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/kualitas');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setData(json.scores);
      setIsDemo(false);
    } catch {
      setData(demoScores);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Derived stats
  const avgScore = data.length > 0 ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length * 10) / 10 : 0;
  const sangat_baik = data.filter((d) => d.score >= 80).length;
  const baik       = data.filter((d) => d.score >= 60 && d.score < 80).length;
  const cukup      = data.filter((d) => d.score >= 40 && d.score < 60).length;
  const poor       = data.filter((d) => d.score < 40).length;

  // Unique orgs for filter
  const orgs = [...new Set(data.map((d) => d.organisasi_name))].sort();

  // Filter + sort
  const filtered = data
    .filter((d) => !filterStatus || d.status === filterStatus)
    .filter((d) => !filterOrg || d.organisasi_name === filterOrg)
    .sort((a, b) => (a[sortBy] ?? 0) - (b[sortBy] ?? 0));

  const columns = [
    {
      key: 'dataset_name',
      label: 'Dataset',
      width: '28%',
      render: (row: QualityScore) => {
        const url = row.dataset_slug
          ? `https://satudata.kotabogor.go.id/dataset/${row.dataset_slug}`
          : null;
        return (
          <div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontWeight: 500, color: 'var(--dataset-link-color)',
                  textDecoration: 'none', lineHeight: 1.3, display: 'inline-block',
                }}
                onMouseOver={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                onMouseOut={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
              >
                {row.dataset_name}
              </a>
            ) : (
              <div style={{ fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{row.dataset_name}</div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{row.organisasi_name}</div>
          </div>
        );
      },
    },
    {
      key: 'score',
      label: 'Skor Total',
      width: '13%',
      render: (row: QualityScore) => {
        const color = getScoreColor(row.score);
        const statusLabel = row.status === 'sangat_baik' ? 'Sangat Baik'
          : row.status === 'baik' ? 'Baik'
          : row.status === 'cukup' ? 'Cukup'
          : row.status === 'perlu_diperbaiki' ? 'Perlu Diperbaiki'
          : getScoreLabel(row.score);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color }}>{row.score}</span>
            </div>
            <span style={{
              display: 'inline-block', fontSize: 10, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20,
              background: `${color}20`, color,
            }}>{statusLabel}</span>
          </div>
        );
      },
    },
    {
      key: 'completeness',
      label: 'Completeness',
      width: '12%',
      render: (row: QualityScore) => <ScoreBar value={row.completeness} />,
    },
    {
      key: 'conformity',
      label: 'Conformity',
      width: '12%',
      render: (row: QualityScore) => <ScoreBar value={row.conformity} />,
    },
    {
      key: 'timeliness',
      label: 'Timeliness',
      width: '12%',
      render: (row: QualityScore) => <ScoreBar value={row.timeliness} />,
    },
    {
      key: 'uniqueness',
      label: 'Uniqueness',
      width: '12%',
      render: (row: QualityScore) => <ScoreBar value={row.uniqueness} />,
    },
    {
      key: 'consistency',
      label: 'Consistency',
      width: '12%',
      render: (row: QualityScore) => <ScoreBar value={row.consistency} />,
    },
    {
      key: 'timestamp',
      label: 'Terakhir Dihitung',
      width: '12%',
      render: (row: QualityScore) => (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(row.timestamp)}</span>
      ),
    },
  ];

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'sangat_baik', label: 'Sangat Baik (≥80)' },
    { value: 'baik',        label: 'Baik (60–79)' },
    { value: 'cukup',       label: 'Cukup (40–59)' },
    { value: 'perlu_diperbaiki', label: 'Perlu Diperbaiki (<40)' },
  ];

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'score',         label: 'Skor Total' },
    { value: 'completeness',  label: 'Completeness' },
    { value: 'conformity',    label: 'Conformity' },
    { value: 'timeliness',    label: 'Timeliness' },
    { value: 'uniqueness',    label: 'Uniqueness' },
    { value: 'consistency',   label: 'Consistency' },
  ];

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">⭐ Kualitas Data</h1>
          <p className="page-subtitle">
            Skor kualitas dataset — Completeness, Conformity, Timeliness, Uniqueness, Consistency
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
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>⭐</div></div>
          <div className="stat-card-value" style={{ color: getScoreColor(avgScore) }}>{avgScore}</div>
          <div className="stat-card-label">Rata-rata Skor</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>🏆</div></div>
          <div className="stat-card-value" style={{ color: '#10b981' }}>{sangat_baik}</div>
          <div className="stat-card-label">Sangat Baik (≥80)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>👍</div></div>
          <div className="stat-card-value" style={{ color: '#3b82f6' }}>{baik}</div>
          <div className="stat-card-label">Baik (60–79)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>⚡</div></div>
          <div className="stat-card-value" style={{ color: '#f59e0b' }}>{cukup}</div>
          <div className="stat-card-label">Cukup (40–59)</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(239,68,68,0.12)' }}>⚠️</div></div>
          <div className="stat-card-value" style={{ color: '#ef4444' }}>{poor}</div>
          <div className="stat-card-label">Perlu Diperbaiki (&lt;40)</div>
        </div>
      </div>

      {/* Filter + Sort Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 12px', fontSize: 13 }}
        >
          {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select
          value={filterOrg}
          onChange={(e) => setFilterOrg(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: 8, padding: '6px 12px', fontSize: 13, maxWidth: 280 }}
        >
          <option value="">Semua Organisasi</option>
          {orgs.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Urutkan:</span>
          {sortOptions.map((o) => (
            <button
              key={o.value}
              onClick={() => setSortBy(o.value)}
              style={{
                padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer',
                background: sortBy === o.value ? 'rgba(59,130,246,0.2)' : 'var(--bg-input)',
                border: `1px solid ${sortBy === o.value ? '#3b82f6' : 'var(--border-subtle)'}`,
                color: sortBy === o.value ? '#3b82f6' : 'var(--text-secondary)',
                fontWeight: sortBy === o.value ? 600 : 400,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div>{[...Array(8)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '0 4px' }}>
              Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> dari <strong style={{ color: 'var(--text-primary)' }}>{data.length}</strong> dataset (diurutkan: skor terendah terlebih dahulu)
            </div>
            <DataTable<QualityScore>
              columns={columns}
              data={filtered}
              pageSize={25}
              searchPlaceholder="Cari dataset atau organisasi..."
              emptyMessage="Belum ada data kualitas"
            />
          </>
        )}
      </div>
    </div>
  );
}
