'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatDate, formatRelativeTime, getScoreColor, getScoreLabel } from '@/lib/utils/format';

const OPENDATA_URL = 'https://satudata.kotabogor.go.id/organization';

interface OrganisasiDetail {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  email: string | null;
  notelp: string | null;
  is_active: boolean;
  total_dataset: number;
  approved: number;
  pct_approved: number;
  avg_kualitas: number | null;
  last_update: string | null;
}

type SortKey = 'total_dataset' | 'approved' | 'pct_approved' | 'avg_kualitas';
type SortDir = 'asc' | 'desc';

export default function OrganisasiPage() {
  const [data,    setData]    = useState<OrganisasiDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('total_dataset');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/organisasi');
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json.organisasi ?? []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Derived stats ────────────────────────────────────────────
  const activeOrgs  = data.filter((o) => o.is_active && o.total_dataset > 0);
  const totalDataset = data.reduce((s, o) => s + o.total_dataset, 0);
  const totalApproved = data.reduce((s, o) => s + o.approved, 0);
  const avgKualitas = (() => {
    const scored = data.filter((o) => o.avg_kualitas != null);
    if (scored.length === 0) return null;
    return scored.reduce((s, o) => s + (o.avg_kualitas ?? 0), 0) / scored.length;
  })();

  // ── Filter + Sort ────────────────────────────────────────────
  const filtered = data
    .filter((o) => {
      const matchSearch = search === '' || o.name.toLowerCase().includes(search.toLowerCase());
      const matchActive = filterActive === 'all'
        ? true
        : filterActive === 'active' ? o.is_active && o.total_dataset > 0 : !o.is_active || o.total_dataset === 0;
      return matchSearch && matchActive;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? -1;
      const bv = b[sortKey] ?? -1;
      return sortDir === 'desc' ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });

  const maxTotal = Math.max(...data.map((o) => o.total_dataset), 1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ' ↕';

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🏢 Organisasi</h1>
          <p className="page-subtitle">Daftar OPD dan kontribusi dataset Satu Data Kota Bogor</p>
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
          {
            icon: '🏢', label: 'Total OPD',
            value: data.length, sub: `${activeOrgs.length} aktif berkontribusi`,
            color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
          },
          {
            icon: '📊', label: 'Total Dataset',
            value: totalDataset, sub: 'dataset aktif & tidak dihapus',
            color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
          },
          {
            icon: '✅', label: 'Total Disetujui',
            value: totalApproved,
            sub: totalDataset > 0 ? `${Math.round((totalApproved / totalDataset) * 100)}% dari total` : '—',
            color: '#10b981', bg: 'rgba(16,185,129,0.12)',
          },
          {
            icon: '⭐', label: 'Rata-rata Skor Kualitas',
            value: avgKualitas != null ? parseFloat(String(avgKualitas)).toFixed(1) : '—',
            sub: avgKualitas != null ? getScoreLabel(parseFloat(String(avgKualitas))) : 'Belum ada skor',
            color: avgKualitas != null ? getScoreColor(parseFloat(String(avgKualitas))) : '#64748b',
            bg: 'rgba(245,158,11,0.12)',
          },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: c.bg }}>{c.icon}</div>
            </div>
            <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
            {c.sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Cari nama OPD..."
          style={{
            flex: '1 1 220px', maxWidth: 320, padding: '7px 12px',
            background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
          }}
        />

        {/* Filter aktif */}
        <div style={{ display: 'flex', gap: 4 }}>
          {([
            { key: 'all',      label: 'Semua' },
            { key: 'active',   label: '✅ Aktif & Berkontribusi' },
            { key: 'inactive', label: '⚠️ Belum/Kosong' },
          ] as const).map((f) => (
            <button key={f.key} onClick={() => setFilterActive(f.key)} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: filterActive === f.key ? 'rgba(59,130,246,0.2)' : 'var(--bg-input)',
              border: `1px solid ${filterActive === f.key ? '#3b82f6' : 'var(--border-subtle)'}`,
              color: filterActive === f.key ? '#3b82f6' : 'var(--text-secondary)',
              fontWeight: filterActive === f.key ? 600 : 400,
            }}>{f.label}</button>
          ))}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>
          {filtered.length} dari {data.length} OPD
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.2fr 0.7fr 0.7fr 0.9fr 1.4fr 0.9fr 0.9fr',
          gap: 8, padding: '10px 16px',
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
          textTransform: 'uppercase', letterSpacing: 0.5,
        }}>
          <div>Nama OPD</div>
          {([
            { key: 'total_dataset', label: 'Total' },
            { key: 'approved',      label: 'Disetujui' },
            { key: 'pct_approved',  label: '% Approval' },
            { key: 'avg_kualitas',  label: 'Skor Kualitas' },
          ] as const).map((col) => (
            <button key={col.key} onClick={() => handleSort(col.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              fontSize: 11, fontWeight: 600, color: sortKey === col.key ? '#3b82f6' : 'var(--text-muted)',
              letterSpacing: 0.5, textTransform: 'uppercase', padding: 0,
            }}>
              {col.label}<SortIcon col={col.key} />
            </button>
          ))}
          <div>Kontribusi</div>
          <div>Update Terakhir</div>
        </div>

        {/* Table Body */}
        {loading ? (
          <div style={{ padding: '12px 16px' }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, marginBottom: 4, borderRadius: 6 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            Tidak ada OPD yang sesuai filter
          </div>
        ) : (
          filtered.map((org, i) => (
            <div
              key={org.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2.2fr 0.7fr 0.7fr 0.9fr 1.4fr 0.9fr 0.9fr',
                gap: 8, padding: '12px 16px', alignItems: 'center',
                background: org.total_dataset === 0
                  ? 'rgba(100,116,139,0.04)'
                  : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border-subtle)',
                transition: 'background 0.1s',
                opacity: org.total_dataset === 0 ? 0.65 : 1,
              }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.04)'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'; }}
            >
              {/* Nama OPD */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={`${OPENDATA_URL}/${org.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontWeight: 500, color: 'var(--dataset-link-color)', textDecoration: 'none', fontSize: 13 }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                  >
                    {org.name}
                  </a>
                  {!org.is_active && (
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: 'rgba(100,116,139,0.15)', color: '#64748b' }}>Nonaktif</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 10 }}>
                  {org.email && <span>✉ {org.email}</span>}
                  {org.website && (
                    <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--primary-400)'; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
                    >🌐 Website</a>
                  )}
                </div>
              </div>

              {/* Total Dataset + bar */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 14 }}>{org.total_dataset}</span>
                </div>
                <div style={{ width: '80%', height: 3, background: 'var(--bg-input)', borderRadius: 2, marginTop: 4 }}>
                  <div style={{ height: '100%', width: `${Math.round((org.total_dataset / maxTotal) * 100)}%`, background: '#3b82f6', borderRadius: 2 }} />
                </div>
              </div>

              {/* Disetujui */}
              <div style={{ fontWeight: 600, color: '#10b981', fontSize: 14 }}>
                {org.approved}
              </div>

              {/* % Approval */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    fontWeight: 600, fontSize: 12,
                    color: org.pct_approved === 100 ? '#10b981' : org.pct_approved >= 70 ? '#3b82f6' : org.pct_approved > 0 ? '#f59e0b' : '#64748b',
                  }}>{org.pct_approved}%</span>
                </div>
                <div style={{ width: '80%', height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${org.pct_approved}%`,
                    background: org.pct_approved === 100 ? '#10b981' : org.pct_approved >= 70 ? '#3b82f6' : org.pct_approved > 0 ? '#f59e0b' : '#64748b',
                    borderRadius: 2, transition: 'width 0.5s',
                  }} />
                </div>
              </div>

              {/* Skor Kualitas */}
              <div>
                {org.avg_kualitas != null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: getScoreColor(org.avg_kualitas), fontSize: 14, minWidth: 32 }}>
                      {org.avg_kualitas.toFixed(1)}
                    </span>
                    <div style={{ flex: 1, maxWidth: 60, height: 4, background: 'var(--bg-input)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${org.avg_kualitas}%`, background: getScoreColor(org.avg_kualitas), borderRadius: 2 }} />
                    </div>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      background: `${getScoreColor(org.avg_kualitas)}20`,
                      color: getScoreColor(org.avg_kualitas), fontWeight: 600,
                    }}>{getScoreLabel(org.avg_kualitas)}</span>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Belum ada skor</span>
                )}
              </div>

              {/* Kontribusi % terhadap total */}
              <div>
                {org.total_dataset > 0 ? (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {totalDataset > 0 ? ((org.total_dataset / totalDataset) * 100).toFixed(1) : '0'}%
                    </div>
                    <div style={{ width: '85%', height: 3, background: 'var(--bg-input)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%',
                        width: `${totalDataset > 0 ? (org.total_dataset / totalDataset) * 100 : 0}%`,
                        background: 'var(--primary-500)', borderRadius: 2,
                      }} />
                    </div>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                )}
              </div>

              {/* Update Terakhir */}
              <div>
                {org.last_update ? (
                  <>
                    <div style={{ fontSize: 12 }}>{formatDate(org.last_update)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatRelativeTime(org.last_update)}</div>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Belum ada data</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer totals */}
      {!loading && filtered.length > 0 && (
        <div className="card" style={{ marginTop: 12, display: 'flex', gap: 24, flexWrap: 'wrap', padding: '12px 20px' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Menampilkan <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> OPD ·{' '}
            <strong style={{ color: '#3b82f6' }}>{filtered.reduce((s, o) => s + o.total_dataset, 0)}</strong> dataset ·{' '}
            <strong style={{ color: '#10b981' }}>{filtered.reduce((s, o) => s + o.approved, 0)}</strong> disetujui
          </span>
        </div>
      )}
    </div>
  );
}
