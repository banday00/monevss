'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/utils/format';

const OPENDATA_URL = 'https://satudata.kotabogor.go.id/dataset';

interface DiscontinueDataset {
  id: number;
  name: string;
  slug: string;
  organisasi_name: string;
  validate_discontinue: string | null;
  timestamp_discontinue_submit: string | null;
  timestamp_discontinue_approved: string | null;
  is_active: boolean;
}

interface DiscontinueHistory {
  id: number;
  dataset_id: number;
  dataset_name: string;
  dataset_slug: string;
  organisasi_name: string;
  type: string;
  notes: string | null;
  username: string | null;
  cdate: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  orgs: number;
}

// ─── Demo data ────────────────────────────────────────────────────────
const demoDatasets: DiscontinueDataset[] = [
  { id: 18870, name: 'Rasio Akseptor Keluarga Berencana (KB) di Kota Bogor', slug: 'rasio-akseptor-kb', organisasi_name: 'Dinas Pengendalian Penduduk dan Keluarga Berencana', validate_discontinue: 'approve-active', timestamp_discontinue_submit: '2025-12-09T14:47:46', timestamp_discontinue_approved: '2025-12-11T10:11:26', is_active: true },
  { id: 18871, name: 'Persentase Laju Pertumbuhan Penduduk di Kota Bogor', slug: 'persentase-laju-pertumbuhan-penduduk', organisasi_name: 'Dinas Pengendalian Penduduk dan Keluarga Berencana', validate_discontinue: 'approve-active', timestamp_discontinue_submit: '2025-12-09T15:03:47', timestamp_discontinue_approved: '2025-12-11T10:10:23', is_active: true },
  { id: 19539, name: 'Optimalisasi Pemberdayaan Masyarakat Tingkat Kecamatan di Kota Bogor', slug: 'optimalisasi-pemberdayaan-masyarakat', organisasi_name: 'Inspektorat', validate_discontinue: 'verification-new-active', timestamp_discontinue_submit: '2025-11-25T11:15:16', timestamp_discontinue_approved: null, is_active: true },
  { id: 19540, name: 'Partisipasi Masyarakat Dalam Pelaksanaan Musrenbang Di Tingkat Kelurahan', slug: 'partisipasi-musrenbang-kelurahan', organisasi_name: 'Inspektorat', validate_discontinue: 'verification-new-active', timestamp_discontinue_submit: '2025-11-25T11:17:40', timestamp_discontinue_approved: null, is_active: true },
];

const demoHistory: DiscontinueHistory[] = [
  { id: 8, dataset_id: 18870, dataset_name: 'Rasio Akseptor KB di Kota Bogor', dataset_slug: 'rasio-akseptor-kb', organisasi_name: 'DPPKB', type: 'approve-active', notes: '', username: '197106242006041011', cdate: '2025-12-11T10:18:27' },
  { id: 7, dataset_id: 18871, dataset_name: 'Persentase Laju Pertumbuhan Penduduk', dataset_slug: 'persentase-laju-pertumbuhan-penduduk', organisasi_name: 'DPPKB', type: 'approve-active', notes: '', username: '197106242006041011', cdate: '2025-12-11T10:17:24' },
  { id: 6, dataset_id: 18871, dataset_name: 'Persentase Laju Pertumbuhan Penduduk', dataset_slug: 'persentase-laju-pertumbuhan-penduduk', organisasi_name: 'DPPKB', type: 'verification-new-active', notes: 'dataset ini berisi persentase laju pertumbuhan penduduk di Kota Bogor', username: 'dppkb_sdi', cdate: '2025-12-09T15:10:48' },
  { id: 5, dataset_id: 18870, dataset_name: 'Rasio Akseptor KB di Kota Bogor', dataset_slug: 'rasio-akseptor-kb', organisasi_name: 'DPPKB', type: 'verification-new-active', notes: 'Dataset ini berisi rasio akseptor KB yang sama dengan data CPR', username: 'dppkb_sdi', cdate: '2025-12-09T14:54:47' },
  { id: 4, dataset_id: 19540, dataset_name: 'Partisipasi Masyarakat Musrenbang', dataset_slug: 'partisipasi-musrenbang-kelurahan', organisasi_name: 'Inspektorat', type: 'verification-new-active', notes: 'bukan data dari inspektorat, harap dihapus', username: 'inspektorat_sdi', cdate: '2025-11-25T11:24:41' },
];

const demoStats: Stats = { total: 4, pending: 2, approved: 2, orgs: 2 };

// ─── Helpers ──────────────────────────────────────────────────────────
function getStatusInfo(val: string | null): { label: string; color: string; bg: string; icon: string } {
  if (val === 'approve-active')          return { label: 'Disetujui',            color: '#10b981', bg: 'rgba(16,185,129,0.15)',  icon: '✅' };
  if (val === 'verification-new-active') return { label: 'Menunggu Persetujuan', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '⏳' };
  return { label: 'Tidak Diketahui', color: '#64748b', bg: 'rgba(100,116,139,0.15)', icon: '❓' };
}

function getHistoryTypeInfo(type: string): { label: string; color: string; icon: string } {
  if (type === 'approve-active')          return { label: 'Disetujui',  color: '#10b981', icon: '✅' };
  if (type === 'verification-new-active') return { label: 'Diajukan',   color: '#f59e0b', icon: '📤' };
  return { label: type, color: '#64748b', icon: '📋' };
}

type FilterStatus = 'all' | 'verification-new-active' | 'approve-active';

export default function DiskontinuasiPage() {
  const [datasets, setDatasets]   = useState<DiscontinueDataset[]>([]);
  const [history, setHistory]     = useState<DiscontinueHistory[]>([]);
  const [stats, setStats]         = useState<Stats>({ total: 0, pending: 0, approved: 0, orgs: 0 });
  const [loading, setLoading]     = useState(true);
  const [isDemo, setIsDemo]       = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [activeTab, setActiveTab] = useState<'list' | 'history'>('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diskontinuasi');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setDatasets(json.datasets);
      setHistory(json.history);
      setStats(json.stats);
      setIsDemo(false);
    } catch {
      setDatasets(demoDatasets);
      setHistory(demoHistory);
      setStats(demoStats);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = filterStatus === 'all'
    ? datasets
    : datasets.filter((d) => d.validate_discontinue === filterStatus);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🔔 Monitoring Diskontinuasi</h1>
          <p className="page-subtitle">
            Pantau dataset yang diajukan dan disetujui untuk diskontinuasi
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

      {/* Stat Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { icon: '📋', label: 'Total Diskontinuasi', value: stats.total, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
          { icon: '⏳', label: 'Menunggu Persetujuan', value: stats.pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { icon: '✅', label: 'Disetujui', value: stats.approved, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { icon: '🏢', label: 'OPD Terlibat', value: stats.orgs, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: c.bg }}>{c.icon}</div>
            </div>
            <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Pipeline View */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: 'var(--text-secondary)' }}>
          📌 Alur Diskontinuasi
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {[
            { step: '1', label: 'Pengajuan', sub: 'OPD mengajukan diskontinuasi', icon: '📤', color: '#8b5cf6' },
            { step: '→', label: '', sub: '', icon: '', color: 'transparent' },
            { step: '2', label: 'Verifikasi', sub: 'Menunggu persetujuan admin', icon: '⏳', color: '#f59e0b', count: stats.pending },
            { step: '→', label: '', sub: '', icon: '', color: 'transparent' },
            { step: '3', label: 'Disetujui', sub: 'Dataset resmi didiskontinuasi', icon: '✅', color: '#10b981', count: stats.approved },
          ].map((s, i) => (
            s.step === '→' ? (
              <div key={i} style={{ flex: '0 0 40px', textAlign: 'center', fontSize: 20, color: 'var(--text-muted)' }}>→</div>
            ) : (
              <div key={i} style={{
                flex: 1, textAlign: 'center', padding: '16px 12px',
                background: `${s.color}12`, border: `1px solid ${s.color}30`,
                borderRadius: 12, minWidth: 160,
              }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>
                  {s.label}
                  {s.count !== undefined && (
                    <span style={{ marginLeft: 6, background: `${s.color}20`, color: s.color, padding: '1px 8px', borderRadius: 12, fontSize: 12 }}>
                      {s.count}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'list',    label: '📋 Daftar Dataset', count: datasets.length },
          { key: 'history', label: '📜 Riwayat Aktifitas', count: history.length },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as 'list' | 'history')}
            style={{
              padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: activeTab === t.key ? 'rgba(139,92,246,0.2)' : 'var(--bg-card)',
              border: `1px solid ${activeTab === t.key ? '#8b5cf6' : 'var(--border-subtle)'}`,
              color: activeTab === t.key ? '#8b5cf6' : 'var(--text-secondary)',
            }}
          >
            {t.label}
            <span style={{
              marginLeft: 8, fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: activeTab === t.key ? '#8b5cf620' : 'var(--bg-input)',
              color: activeTab === t.key ? '#8b5cf6' : 'var(--text-muted)',
            }}>{t.count}</span>
          </button>
        ))}

        {/* Filter status — hanya tampil di tab list */}
        {activeTab === 'list' && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status:</span>
            {(['all', 'verification-new-active', 'approve-active'] as FilterStatus[]).map((s) => {
              const labels: Record<FilterStatus, string> = { all: 'Semua', 'verification-new-active': 'Menunggu', 'approve-active': 'Disetujui' };
              const active = filterStatus === s;
              return (
                <button key={s} onClick={() => setFilterStatus(s)} style={{
                  padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: active ? 'rgba(139,92,246,0.2)' : 'var(--bg-input)',
                  border: `1px solid ${active ? '#8b5cf6' : 'var(--border-subtle)'}`,
                  color: active ? '#8b5cf6' : 'var(--text-secondary)',
                  fontWeight: active ? 600 : 400,
                }}>{labels[s]}</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="card">{[...Array(5)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div>
      ) : activeTab === 'list' ? (

        /* ─── Dataset List ─── */
        <div className="card">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Tidak ada dataset yang sesuai filter
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {filtered.map((d, i) => {
                const si = getStatusInfo(d.validate_discontinue);
                return (
                  <div
                    key={d.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 1fr',
                      gap: 16, alignItems: 'center',
                      padding: '14px 16px',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderRadius: 8,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Nama + Org */}
                    <div>
                      <a
                        href={`${OPENDATA_URL}/${d.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontWeight: 500, color: 'var(--primary-400)', textDecoration: 'none', lineHeight: 1.3, display: 'block', fontSize: 13 }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                      >
                        {d.name}
                      </a>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>🏢 {d.organisasi_name}</div>
                    </div>

                    {/* Status */}
                    <div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: si.bg, color: si.color,
                      }}>
                        {si.icon} {si.label}
                      </span>
                    </div>

                    {/* Tanggal Diajukan */}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Diajukan</div>
                      <div style={{ fontSize: 12 }}>{d.timestamp_discontinue_submit ? formatDate(d.timestamp_discontinue_submit) : '—'}</div>
                      {d.timestamp_discontinue_submit && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatRelativeTime(d.timestamp_discontinue_submit)}</div>
                      )}
                    </div>

                    {/* Tanggal Disetujui */}
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Disetujui</div>
                      {d.timestamp_discontinue_approved ? (
                        <>
                          <div style={{ fontSize: 12 }}>{formatDate(d.timestamp_discontinue_approved)}</div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatRelativeTime(d.timestamp_discontinue_approved)}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Belum disetujui</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      ) : (

        /* ─── History Timeline ─── */
        <div className="card">
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
            Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{history.length}</strong> aktivitas diskontinuasi terbaru
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Garis vertikal timeline */}
            <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--border-subtle)' }} />

            {history.map((h) => {
              const ti = getHistoryTypeInfo(h.type);
              return (
                <div key={h.id} style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
                    background: `${ti.color}20`, border: `2px solid ${ti.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, zIndex: 1, position: 'relative',
                  }}>
                    {ti.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <a
                          href={`${OPENDATA_URL}/${h.dataset_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: 500, color: 'var(--primary-400)', textDecoration: 'none', fontSize: 13, lineHeight: 1.3 }}
                          onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                          onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                        >
                          {h.dataset_name}
                        </a>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          🏢 {h.organisasi_name}
                          {h.username && <span> · 👤 {h.username}</span>}
                        </div>
                        {h.notes && (
                          <div style={{
                            marginTop: 6, padding: '6px 10px',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                            borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic',
                          }}>
                            "{h.notes}"
                          </div>
                        )}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          background: `${ti.color}15`, color: ti.color,
                          fontSize: 11, fontWeight: 600,
                        }}>
                          {ti.label}
                        </span>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          {formatDateTime(h.cdate)}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          {formatRelativeTime(h.cdate)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
