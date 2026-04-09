'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatPercentage } from '@/lib/utils/format';

interface PengumpulanOrg {
  organisasi_id: number;
  organisasi_name: string;
  year: number;
  total_priority: number;
  fulfilled: number;
  unfulfilled: number;
  percentage: number;
}

interface YearlySummary {
  year: number;
  total_priority: number;
  fulfilled: number;
  percentage: number;
  total_orgs: number;
}

interface Summary {
  totalOrgs: number;
  totalPriority: number;
  totalFulfilled: number;
  totalUnfulfilled: number;
  overallPercentage: number;
  selectedYear: number;
}

interface UnlinkedOPD {
  opd: string;
  total: number;
  belum_linked: number;
  pct_linked: number;
}

interface UnlinkedStats {
  total_datasets: number;
  linked: number;
  not_linked: number;
  pct_linked: number;
  baru_30hari: number;
  diupdate_belum_linked: number;
  top_opd: UnlinkedOPD[];
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#3b82f6';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
}

export default function PengumpulanPage() {
  const [perOrg,   setPerOrg]   = useState<PengumpulanOrg[]>([]);
  const [yearly,   setYearly]   = useState<YearlySummary[]>([]);
  const [summary,  setSummary]  = useState<Summary | null>(null);
  const [unlinked, setUnlinked] = useState<UnlinkedStats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [isDemo,   setIsDemo]   = useState(false);
  const [showUnlinkedTable, setShowUnlinkedTable] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).reverse();
  const [selectedYear, setSelectedYear] = useState(currentYear - 1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pengumpulan?year=${selectedYear}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setPerOrg(json.perOrganisasi);
      setYearly(json.yearly);
      setSummary(json.summary);
      setUnlinked(json.unlinked ?? null);
      setIsDemo(false);
    } catch {
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !summary) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">📈 Pengumpulan Data</h1>
          <p className="page-subtitle">Persentase pemenuhan data prioritas per organisasi</p>
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton skeleton-stat" />
          ))}
        </div>
        <div className="skeleton skeleton-chart" style={{ marginBottom: 24 }} />
      </div>
    );
  }

  const circumference = 2 * Math.PI * 68;
  const dashOffset = circumference - (summary.overallPercentage / 100) * circumference;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📈 Pengumpulan Data</h1>
        <p className="page-subtitle">
          Persentase pemenuhan data prioritas per organisasi
          {isDemo && (
            <span style={{ marginLeft: 12, padding: '2px 10px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
              ⚠️ Mode Demo
            </span>
          )}
        </p>
      </div>

      {/* Year selector */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Tahun:</label>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {years.map((y) => (
            <button key={y} className={`tab ${selectedYear === y ? 'active' : ''}`} onClick={() => setSelectedYear(y)}>
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards + Ring */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 200px', marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>🏢</div></div>
          <div className="stat-card-value">{summary.totalOrgs}</div>
          <div className="stat-card-label">Organisasi</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>🎯</div></div>
          <div className="stat-card-value">{summary.totalPriority}</div>
          <div className="stat-card-label">Total Data Prioritas</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header"><div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>✅</div></div>
          <div className="stat-card-value">
            {summary.totalFulfilled}
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 400 }}> / {summary.totalPriority}</span>
          </div>
          <div className="stat-card-label">Terpenuhi</div>
        </div>
        <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="progress-ring">
            <svg width="160" height="160">
              <circle className="progress-ring-bg" cx="80" cy="80" r="68" />
              <circle
                className="progress-ring-fill"
                cx="80" cy="80" r="68"
                stroke={getProgressColor(summary.overallPercentage)}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="progress-ring-text">
              <div className="progress-ring-value" style={{ color: getProgressColor(summary.overallPercentage) }}>
                {formatPercentage(summary.overallPercentage)}
              </div>
              <div className="progress-ring-label">Coverage</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── UNLINKED DATASET SECTION ─────────────────────────────── */}
      {unlinked && (
        <div style={{ marginBottom: 28 }}>
          {/* Alert Banner */}
          {unlinked.not_linked > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', marginBottom: 14,
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10,
            }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 500 }}>
                Terdapat <strong>{unlinked.not_linked}</strong> dataset ({100 - unlinked.pct_linked}% dari total) yang belum terhubung ke Data Prioritas.
                {unlinked.baru_30hari > 0 && (
                  <> &nbsp;·&nbsp; <strong>{unlinked.baru_30hari}</strong> di antaranya baru ditambahkan dalam 30 hari terakhir.</>
                )}
              </span>
            </div>
          )}

          {/* Stat Cards Unlinked */}
          <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            📌 Status Keterhubungan Dataset ke Data Prioritas
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {[
              {
                icon: '🔗', label: 'Belum Terhubung',
                value: unlinked.not_linked,
                sub: `dari ${unlinked.total_datasets} total dataset`,
                color: unlinked.not_linked > 200 ? '#ef4444' : unlinked.not_linked > 100 ? '#f59e0b' : '#10b981',
                bg: 'rgba(239,68,68,0.10)',
              },
              {
                icon: '🆕', label: 'Baru (30 Hari) Belum Linked',
                value: unlinked.baru_30hari,
                sub: 'dataset baru yang belum dipetakan',
                color: unlinked.baru_30hari > 0 ? '#f59e0b' : '#10b981',
                bg: 'rgba(245,158,11,0.10)',
              },
              {
                icon: '🔄', label: 'Diupdate, Belum Linked',
                value: unlinked.diupdate_belum_linked,
                sub: 'pernah diupdate tapi belum dipetakan',
                color: '#8b5cf6',
                bg: 'rgba(139,92,246,0.10)',
              },
              {
                icon: '✅', label: '% Keterhubungan',
                value: `${unlinked.pct_linked}%`,
                sub: `${unlinked.linked} dataset sudah terhubung`,
                color: getProgressColor(unlinked.pct_linked),
                bg: 'rgba(16,185,129,0.10)',
              },
            ].map((c) => (
              <div key={c.label} className="stat-card">
                <div className="stat-card-header">
                  <div className="stat-card-icon" style={{ background: c.bg }}>{c.icon}</div>
                </div>
                <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
                <div className="stat-card-label">{c.label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Progress bar keterhubungan keseluruhan */}
          <div className="card" style={{ padding: '12px 18px', marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Keterhubungan keseluruhan</span>
              <span style={{ color: 'var(--text-muted)' }}>
                <strong style={{ color: '#10b981' }}>{unlinked.linked}</strong>
                <span style={{ color: 'var(--text-muted)' }}> linked · </span>
                <strong style={{ color: '#ef4444' }}>{unlinked.not_linked}</strong>
                <span style={{ color: 'var(--text-muted)' }}> belum</span>
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 0.6s ease',
                background: `linear-gradient(90deg, #10b981 ${unlinked.pct_linked}%, #ef4444 ${unlinked.pct_linked}%)`,
                width: '100%',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-muted)' }}>
              <span>0%</span>
              <span style={{ color: getProgressColor(unlinked.pct_linked), fontWeight: 600 }}>{unlinked.pct_linked}% terhubung</span>
              <span>100%</span>
            </div>
          </div>

          {/* Top OPD belum linked — collapsible */}
          <div className="card" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
            <button
              onClick={() => setShowUnlinkedTable((v) => !v)}
              style={{
                width: '100%', padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                <span>🏢</span>
                <span>Top 10 OPD dengan Dataset Belum Terhubung Prioritas</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{showUnlinkedTable ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
            </button>

            {showUnlinkedTable && (
              <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {/* Header */}
                <div style={{
                  display: 'grid', gridTemplateColumns: '2.5fr 0.6fr 0.8fr 1.6fr',
                  padding: '8px 18px', background: 'var(--bg-primary)',
                  fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                  textTransform: 'uppercase', letterSpacing: 0.5,
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div>Nama OPD</div>
                  <div>Total</div>
                  <div>Blm Linked</div>
                  <div>% Terhubung</div>
                </div>
                {unlinked.top_opd.map((opd, i) => (
                  <div
                    key={opd.opd}
                    style={{
                      display: 'grid', gridTemplateColumns: '2.5fr 0.6fr 0.8fr 1.6fr',
                      padding: '10px 18px', alignItems: 'center',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{opd.opd}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{opd.total}</div>
                    <div>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                        background: opd.belum_linked > 30 ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                        color: opd.belum_linked > 30 ? '#ef4444' : '#f59e0b',
                      }}>{opd.belum_linked}</span>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 100, height: 5, background: 'var(--bg-input)', borderRadius: 3 }}>
                          <div style={{
                            height: '100%', width: `${opd.pct_linked}%`,
                            background: getProgressColor(opd.pct_linked), borderRadius: 3,
                            transition: 'width 0.5s',
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: getProgressColor(opd.pct_linked) }}>
                          {opd.pct_linked}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '8px 18px', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)' }}>
                  💡 Hubungkan dataset ke Data Prioritas melalui menu Data Prioritas agar tercatat dalam pemenuhan target pengumpulan data.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Year-over-Year Chart & Per Org List */}
      <div className="dashboard-grid">
        {/* Yearly Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Trend Pengumpulan per Tahun</h3>
              <p className="card-subtitle">Perbandingan 5 tahun terakhir</p>
            </div>
          </div>
          <div className="chart-container" style={{ minHeight: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(17, 24, 39, 0.95)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: '10px', color: '#f1f5f9', fontSize: '13px' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Bar dataKey="fulfilled" name="Terpenuhi" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />
                <Bar dataKey="total_priority" name="Total Prioritas" fill="rgba(59,130,246,0.4)" radius={[4, 4, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per Organisation Progress */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Progress per Organisasi</h3>
              <p className="card-subtitle">Tahun {selectedYear} — Diurutkan berdasarkan persentase</p>
            </div>
          </div>
          <div className="org-progress-list" style={{ maxHeight: 400, overflowY: 'auto' }}>
            {perOrg.map((org) => (
              <div key={org.organisasi_id} className="org-progress-item">
                <div className="org-progress-header">
                  <span className="org-progress-name">{org.organisasi_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="org-progress-stats">{org.fulfilled}/{org.total_priority}</span>
                    <span className="org-progress-pct" style={{ color: getProgressColor(org.percentage) }}>
                      {formatPercentage(org.percentage)}
                    </span>
                  </div>
                </div>
                <div className="org-progress-bar">
                  <div
                    className="org-progress-fill"
                    style={{
                      width: `${Math.min(org.percentage, 100)}%`,
                      background: `linear-gradient(90deg, ${getProgressColor(org.percentage)}, ${getProgressColor(org.percentage)}80)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
