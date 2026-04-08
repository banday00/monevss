'use client';

import { useEffect, useState, useCallback } from 'react';
import { getScoreColor } from '@/lib/utils/format';

// ─── Types ─────────────────────────────────────────────────────────
interface MonthlyReport {
  bulan: string;
  dataset_baru: number;
  dataset_diupdate: number;
  avg_score: number | null;
}
interface YearlyReport {
  tahun: number;
  total_dataset: number;
  approved: number;
  pct_approved: number;
}
interface OrgReport {
  organisasi: string;
  total_dataset: number;
  approved: number;
  pct_approved: number;
  avg_score: number | null;
}
interface Summary {
  total_dataset: number;
  total_approved: number;
  total_orgs: number;
  avg_score: number | null;
  dataset_this_month: number;
  dataset_this_year: number;
}

// ─── Helpers ───────────────────────────────────────────────────────
function formatBulan(ym: string): string {
  const [y, m] = ym.split('-');
  const names = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${names[parseInt(m) - 1]} ${y}`;
}

function exportCSV(data: OrgReport[]) {
  const header = ['Organisasi','Total Dataset','Disetujui','% Disetujui','Rata-rata Skor Kualitas'];
  const rows = data.map((r) => [
    `"${r.organisasi}"`,
    r.total_dataset,
    r.approved,
    r.pct_approved + '%',
    r.avg_score ?? '-',
  ]);
  const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `laporan-opd-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Improved Bar Chart ────────────────────────────────────────────
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  data: MonthlyReport | null;
}

function BarChart({ data }: { data: MonthlyReport[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, data: null });

  const ordered  = [...data].reverse(); // oldest → newest
  const maxBaru  = Math.max(...ordered.map((d) => d.dataset_baru), 1);
  const maxUpdate = Math.max(...ordered.map((d) => d.dataset_diupdate), 1);
  const maxVal   = Math.max(maxBaru, maxUpdate, 1);

  // Y-axis ticks
  const tickCount = 5;
  const tickStep  = Math.ceil(maxVal / tickCount);
  const ticks     = Array.from({ length: tickCount + 1 }, (_, i) => i * tickStep);
  const chartH    = 200; // px for bars area

  return (
    <div style={{ position: 'relative' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, justifyContent: 'flex-end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(to top,#3b82f6,#6366f1)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Dataset Baru</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: 'linear-gradient(to top,#f59e0b,#fb923c)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Dataset Diupdate</span>
        </div>
      </div>

      {/* Chart area */}
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Y-axis */}
        <div style={{
          display: 'flex', flexDirection: 'column-reverse', justifyContent: 'space-between',
          width: 36, paddingBottom: 36, paddingRight: 6, flexShrink: 0,
        }}>
          {ticks.map((t) => (
            <div key={t} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'right', lineHeight: 1 }}>{t}</div>
          ))}
        </div>

        {/* Bars + gridlines */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Gridlines */}
          <div style={{ position: 'absolute', inset: 0, bottom: 36, pointerEvents: 'none' }}>
            {ticks.map((t) => (
              <div key={t} style={{
                position: 'absolute',
                bottom: `${(t / (tickStep * tickCount)) * 100}%`,
                left: 0, right: 0,
                borderTop: `1px ${t === 0 ? 'solid rgba(255,255,255,0.15)' : 'dashed rgba(255,255,255,0.06)'}`,
              }} />
            ))}
          </div>

          {/* Bar columns */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: ordered.length > 8 ? 4 : 8,
            height: chartH + 36, paddingBottom: 36, position: 'relative',
          }}>
            {ordered.map((d, i) => {
              const heightBaru   = Math.max(2, Math.round((d.dataset_baru    / (tickStep * tickCount)) * chartH));
              const heightUpdate = Math.max(2, Math.round((d.dataset_diupdate / (tickStep * tickCount)) * chartH));
              const isMax        = d.dataset_baru === maxBaru;

              return (
                <div
                  key={d.bulan}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, cursor: 'pointer' }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const container = e.currentTarget.closest('.chart-wrapper') as HTMLElement;
                    const cRect = container?.getBoundingClientRect();
                    setTooltip({
                      visible: true,
                      x: (cRect ? rect.left - cRect.left + rect.width / 2 : rect.left),
                      y: cRect ? rect.top - cRect.top : rect.top,
                      data: d,
                    });
                  }}
                  onMouseLeave={() => setTooltip((t) => ({ ...t, visible: false }))}
                >
                  {/* Value label on top of bar */}
                  <div style={{
                    fontSize: 10, fontWeight: 600,
                    color: isMax ? '#6366f1' : 'var(--text-muted)',
                    marginBottom: 2, whiteSpace: 'nowrap',
                  }}>
                    {d.dataset_baru > 0 ? d.dataset_baru : ''}
                  </div>

                  {/* Bar group */}
                  <div style={{ width: '100%', display: 'flex', gap: 2, alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Baru bar */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      <div style={{
                        height: `${heightBaru}px`,
                        background: isMax
                          ? 'linear-gradient(to top, #4f46e5, #818cf8)'
                          : 'linear-gradient(to top, #3b82f6, #6366f1)',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.4s ease, filter 0.2s',
                        filter: tooltip.data?.bulan === d.bulan ? 'brightness(1.2)' : 'brightness(1)',
                        boxShadow: isMax ? '0 0 8px rgba(99,102,241,0.4)' : 'none',
                      }} />
                    </div>
                    {/* Diupdate bar */}
                    {d.dataset_diupdate > 0 && (
                      <div style={{ flex: 1 }}>
                        <div style={{
                          height: `${heightUpdate}px`,
                          background: 'linear-gradient(to top, #f59e0b, #fb923c)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'height 0.4s ease',
                          opacity: 0.8,
                        }} />
                      </div>
                    )}
                  </div>

                  {/* X-axis label */}
                  <div style={{
                    fontSize: ordered.length > 10 ? 9 : 10,
                    color: isMax ? '#6366f1' : 'var(--text-muted)',
                    fontWeight: isMax ? 700 : 400,
                    marginTop: 5, textAlign: 'center', lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                  }}>
                    {/* First line: month name */}
                    <div>{formatBulan(d.bulan).split(' ')[0]}</div>
                    {/* Second line: year (dimmer) */}
                    <div style={{ opacity: 0.6, fontSize: 9 }}>{formatBulan(d.bulan).split(' ')[1]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div style={{
          position: 'absolute',
          left: Math.min(tooltip.x - 60, 999),
          top: Math.max(tooltip.y - 90, 0),
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 8, padding: '8px 12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 100, pointerEvents: 'none', minWidth: 140,
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: 'var(--text-primary)' }}>
            📅 {formatBulan(tooltip.data.bulan)}
          </div>
          <div style={{ fontSize: 12, color: '#3b82f6', marginBottom: 2 }}>
            📦 Baru: <strong>{tooltip.data.dataset_baru}</strong>
          </div>
          <div style={{ fontSize: 12, color: '#f59e0b', marginBottom: 2 }}>
            🔄 Diupdate: <strong>{tooltip.data.dataset_diupdate}</strong>
          </div>
          {tooltip.data.avg_score != null && (
            <div style={{ fontSize: 12, color: getScoreColor(parseFloat(String(tooltip.data.avg_score))) }}>
              ⭐ Kualitas: <strong>{parseFloat(String(tooltip.data.avg_score)).toFixed(1)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function LaporanPage() {
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [monthly,  setMonthly]  = useState<MonthlyReport[]>([]);
  const [yearly,   setYearly]   = useState<YearlyReport[]>([]);
  const [orgs,     setOrgs]     = useState<OrgReport[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [months,   setMonths]   = useState(12);
  const [activeTab, setActiveTab] = useState<'bulanan' | 'tahunan' | 'opd'>('bulanan');
  const [sortOrg, setSortOrg]   = useState<'total' | 'approved' | 'score'>('total');
  const [orgSearch, setOrgSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/laporan?months=${months}`);
      const json = await res.json();
      setSummary(json.summary);
      setMonthly(json.monthly ?? []);
      setYearly(json.yearly  ?? []);
      setOrgs(json.orgs      ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [months]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Sorted + filtered org data
  const sortedOrgs = [...orgs]
    .filter((o) => orgSearch === '' || o.organisasi.toLowerCase().includes(orgSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortOrg === 'total')    return b.total_dataset - a.total_dataset;
      if (sortOrg === 'approved') return b.pct_approved  - a.pct_approved;
      if (sortOrg === 'score')    return (b.avg_score ?? 0) - (a.avg_score ?? 0);
      return 0;
    });

  const maxOrgTotal = Math.max(...orgs.map((o) => o.total_dataset), 1);

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">📋 Laporan</h1>
          <p className="page-subtitle">Ringkasan dan statistik dataset Satu Data Kota Bogor</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => exportCSV(orgs)}
            style={{
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ⬇ Export CSV OPD
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🖨 Print
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        {[
          { icon: '📊', label: 'Total Dataset Aktif',  value: summary?.total_dataset ?? '—',  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { icon: '✅', label: 'Total Disetujui',      value: summary?.total_approved ?? '—',  color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { icon: '🏢', label: 'OPD Berkontribusi',    value: summary?.total_orgs ?? '—',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
          { icon: '⭐', label: 'Rata-rata Skor Kualitas', value: summary?.avg_score != null ? parseFloat(String(summary.avg_score)).toFixed(1) : '—', color: getScoreColor(summary?.avg_score != null ? parseFloat(String(summary.avg_score)) : 0), bg: 'rgba(245,158,11,0.12)' },
          { icon: '🆕', label: 'Baru Bulan Ini',       value: summary?.dataset_this_month ?? '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { icon: '📅', label: 'Baru Tahun Ini',       value: summary?.dataset_this_year ?? '—',  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-card-header"><div className="stat-card-icon" style={{ background: c.bg }}>{c.icon}</div></div>
            <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'bulanan', label: '📅 Laporan Bulanan' },
          { key: 'tahunan', label: '📆 Laporan Tahunan' },
          { key: 'opd',     label: '🏢 Laporan Per OPD' },
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key as typeof activeTab)} style={{
            padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
            background: activeTab === t.key ? 'rgba(99,102,241,0.2)' : 'var(--bg-card)',
            border: `1px solid ${activeTab === t.key ? '#6366f1' : 'var(--border-subtle)'}`,
            color: activeTab === t.key ? '#6366f1' : 'var(--text-secondary)',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="card">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton skeleton-row" style={{ marginBottom: 8 }} />)}
        </div>
      ) : (
        <>
          {/* ─── BULANAN ─── */}
          {activeTab === 'bulanan' && (
            <div>
              {/* Filter rentang bulan */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tampilkan:</span>
                {[3, 6, 12, 24].map((m) => (
                  <button key={m} onClick={() => setMonths(m)} style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                    background: months === m ? 'rgba(99,102,241,0.2)' : 'var(--bg-input)',
                    border: `1px solid ${months === m ? '#6366f1' : 'var(--border-subtle)'}`,
                    color: months === m ? '#6366f1' : 'var(--text-secondary)',
                    fontWeight: months === m ? 600 : 400,
                  }}>{m} Bulan</button>
                ))}
              </div>

              {/* Bar chart */}
              <div className="card chart-wrapper" style={{ marginBottom: 16, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                      📊 Tren Dataset Baru per Bulan
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {monthly.length} bulan terakhir &nbsp;·&nbsp; total{' '}
                      <strong style={{ color: '#6366f1' }}>{monthly.reduce((s, d) => s + Number(d.dataset_baru), 0)}</strong>
                      {' '}dataset baru &nbsp;·&nbsp;{' '}
                      <strong style={{ color: '#f59e0b' }}>{monthly.reduce((s, d) => s + Number(d.dataset_diupdate), 0)}</strong>
                      {' '}diupdate
                    </div>
                  </div>
                </div>
                {monthly.length > 0 ? <BarChart data={monthly} /> : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>Belum ada data</div>
                )}
              </div>

              {/* Monthly table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)' }}>
                      {['Bulan', 'Dataset Baru', 'Dataset Diupdate', 'Rata-rata Kualitas'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthly.length === 0 ? (
                      <tr><td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada data</td></tr>
                    ) : monthly.map((r, i) => (
                      <tr key={r.bulan} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '11px 16px', fontWeight: 500 }}>{formatBulan(r.bulan)}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontWeight: 600, color: '#3b82f6' }}>{r.dataset_baru}</span>
                            <div style={{ flex: 1, maxWidth: 80, height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${Math.round((r.dataset_baru / Math.max(...monthly.map(m=>m.dataset_baru),1))*100)}%`, background: '#3b82f6', borderRadius: 2 }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ color: '#f59e0b', fontWeight: 600 }}>{r.dataset_diupdate}</span>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          {r.avg_score != null ? (
                            <span style={{ color: getScoreColor(r.avg_score), fontWeight: 600 }}>
                              {parseFloat(String(r.avg_score)).toFixed(1)}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAHUNAN ─── */}
          {activeTab === 'tahunan' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)' }}>
                    {['Tahun', 'Total Dataset', 'Disetujui', '% Approval', 'Status'].map((h) => (
                      <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border-subtle)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yearly.map((r, i) => (
                    <tr key={r.tahun} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: 16, color: i === 0 ? '#6366f1' : 'var(--text-primary)' }}>
                        {r.tahun}
                        {i === 0 && <span style={{ marginLeft: 6, fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.15)', padding: '2px 7px', borderRadius: 10 }}>Tahun ini</span>}
                      </td>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#3b82f6' }}>{r.total_dataset.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '14px 20px', color: '#10b981', fontWeight: 600 }}>{r.approved.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 100, height: 6, background: 'var(--bg-input)', borderRadius: 3 }}>
                            <div style={{ height: '100%', width: `${r.pct_approved}%`, background: r.pct_approved >= 80 ? '#10b981' : r.pct_approved >= 60 ? '#3b82f6' : '#f59e0b', borderRadius: 3, transition: 'width 0.5s' }} />
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{r.pct_approved}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                          background: r.pct_approved >= 80 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: r.pct_approved >= 80 ? '#10b981' : '#f59e0b',
                        }}>
                          {r.pct_approved >= 80 ? '✅ Baik' : '⚠️ Perlu Peningkatan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── PER OPD ─── */}
          {activeTab === 'opd' && (
            <div>
              {/* Controls */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
                <input
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  placeholder="Cari OPD..."
                  style={{
                    padding: '6px 12px', borderRadius: 6, fontSize: 12,
                    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', width: 240,
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Urutkan:</span>
                {[
                  { key: 'total',    label: 'Total Dataset' },
                  { key: 'approved', label: '% Approval' },
                  { key: 'score',    label: 'Skor Kualitas' },
                ].map((s) => (
                  <button key={s.key} onClick={() => setSortOrg(s.key as typeof sortOrg)} style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                    background: sortOrg === s.key ? 'rgba(99,102,241,0.2)' : 'var(--bg-input)',
                    border: `1px solid ${sortOrg === s.key ? '#6366f1' : 'var(--border-subtle)'}`,
                    color: sortOrg === s.key ? '#6366f1' : 'var(--text-secondary)',
                    fontWeight: sortOrg === s.key ? 600 : 400,
                  }}>{s.label}</button>
                ))}
                <button onClick={() => exportCSV(sortedOrgs)} style={{
                  marginLeft: 'auto', padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', fontWeight: 600,
                }}>⬇ Export CSV</button>
              </div>

              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)' }}>
                      {['#', 'Organisasi (OPD)', 'Total Dataset', 'Disetujui', '% Approval', 'Skor Kualitas Rata-rata'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrgs.map((r, i) => (
                      <tr key={r.organisasi} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                        <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 11 }}>{i + 1}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 500, maxWidth: 280 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.organisasi}>{r.organisasi}</div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, color: '#3b82f6', minWidth: 28 }}>{r.total_dataset}</span>
                            <div style={{ width: 60, height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${Math.round((r.total_dataset / maxOrgTotal) * 100)}%`, background: '#3b82f6', borderRadius: 2 }} />
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px', color: '#10b981', fontWeight: 600 }}>{r.approved}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 50, height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                              <div style={{ height: '100%', width: `${r.pct_approved}%`, background: r.pct_approved === 100 ? '#10b981' : r.pct_approved >= 70 ? '#3b82f6' : '#f59e0b', borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{r.pct_approved}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {r.avg_score != null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontWeight: 700, color: getScoreColor(parseFloat(String(r.avg_score))), minWidth: 36 }}>{parseFloat(String(r.avg_score)).toFixed(1)}</span>
                              <div style={{ width: 60, height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                                <div style={{ height: '100%', width: `${r.avg_score}%`, background: getScoreColor(r.avg_score), borderRadius: 2 }} />
                              </div>
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Belum ada skor</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer summary */}
              <div className="card" style={{ marginTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total OPD</div>
                  <div style={{ fontWeight: 700, color: '#8b5cf6', fontSize: 18 }}>{sortedOrgs.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Dataset</div>
                  <div style={{ fontWeight: 700, color: '#3b82f6', fontSize: 18 }}>{sortedOrgs.reduce((s, o) => s + o.total_dataset, 0).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Disetujui</div>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: 18 }}>{sortedOrgs.reduce((s, o) => s + o.approved, 0).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Rata-rata % Approval</div>
                  <div style={{ fontWeight: 700, color: '#f59e0b', fontSize: 18 }}>
                    {sortedOrgs.length > 0 ? Math.round(sortedOrgs.reduce((s, o) => s + o.pct_approved, 0) / sortedOrgs.length) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
