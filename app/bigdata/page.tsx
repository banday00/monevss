'use client';

import { useEffect, useState, useCallback } from 'react';

const OPENDATA_URL = 'https://satudata.kotabogor.go.id/dataset';

interface BigdataSchema {
  schema_name: string;
  org_name: string | null;
  table_count: number;
  dataset_count: number;
}

interface BigdataTable {
  schema_name: string;
  table_name: string;
  dataset_id: number | null;
  dataset_name: string | null;
  dataset_slug: string | null;
  row_count: number | null;
  col_count: number | null;
}

interface BigdataColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

// ─── Schema Name Formatter ─────────────────────────────────────────
function formatSchemaName(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTableName(s: string): string {
  return s.replace(/_/g, ' ');
}

function formatNumber(n: number | null): string {
  if (n === null) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'jt';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'rb';
  return n.toLocaleString('id-ID');
}

// ─── Data Viewer Modal ─────────────────────────────────────────────
function DataViewerModal({
  schema, table, datasetName, datasetSlug, onClose,
}: {
  schema: string; table: string; datasetName: string | null; datasetSlug: string | null; onClose: () => void;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<BigdataColumn[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 50;

  const fetchData = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const [colRes, dataRes] = await Promise.all([
        fetch(`/api/bigdata/${encodeURIComponent(schema)}/${encodeURIComponent(table)}?mode=columns`),
        fetch(`/api/bigdata/${encodeURIComponent(schema)}/${encodeURIComponent(table)}?page=${p}&pageSize=${pageSize}`),
      ]);
      if (!colRes.ok || !dataRes.ok) throw new Error('Gagal memuat data');
      const colJson  = await colRes.json();
      const dataJson = await dataRes.json();
      setColumns(colJson.columns);
      setRows(dataJson.rows);
      setTotal(dataJson.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal terhubung ke BigData');
    } finally {
      setLoading(false);
    }
  }, [schema, table]);

  useEffect(() => { fetchData(page); }, [fetchData, page]);

  const totalPages = Math.ceil(total / pageSize);

  // Client-side search across all string values
  const filtered = searchTerm
    ? rows.filter((r) => Object.values(r).some((v) => String(v ?? '').toLowerCase().includes(searchTerm.toLowerCase())))
    : rows;

  // Export CSV
  const handleExport = () => {
    if (rows.length === 0) return;
    const colNames = columns.map((c) => c.column_name);
    const csvRows = [
      colNames.join(','),
      ...rows.map((r) => colNames.map((c) => {
        const val = String(r[c] ?? '');
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${schema}_${table}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', overflowY: 'auto',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '95vw', maxWidth: 1400, background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)', borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Modal Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
              📦 {formatSchemaName(schema)} / {formatTableName(table)}
            </div>
            {datasetName && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Dataset: {' '}
                {datasetSlug ? (
                  <a href={`${OPENDATA_URL}/${datasetSlug}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--primary-400)', textDecoration: 'none' }}
                    onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                  >{datasetName}</a>
                ) : datasetName}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total: <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(total)} baris</strong></span>
            <button onClick={handleExport} disabled={rows.length === 0} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
              color: '#10b981', fontWeight: 600,
            }}>⬇ Export CSV</button>
            <button onClick={onClose} style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}>✕ Tutup</button>
          </div>
        </div>

        {/* Search + Columns Info */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari dalam data..."
            style={{
              flex: 1, maxWidth: 320, padding: '6px 12px',
              background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
              borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {columns.length} kolom ·{' '}
            {filtered.length !== rows.length
              ? <><strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> dari {rows.length} baris (halaman {page})</>
              : <><strong style={{ color: 'var(--text-primary)' }}>{rows.length}</strong> baris (halaman {page}/{totalPages})</>
            }
          </span>
          {/* Column pills */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 600 }}>
            {columns.slice(0, 8).map((c) => (
              <span key={c.column_name} style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 4,
                background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                border: '1px solid rgba(59,130,246,0.2)',
              }}>{c.column_name}</span>
            ))}
            {columns.length > 8 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{columns.length - 8} lagi</span>}
          </div>
        </div>

        {/* Table Content */}
        <div style={{ padding: 0, overflowX: 'auto', maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
              Memuat data dari BigData...
            </div>
          ) : error ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔒</div>
              <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>Akses Terbatas</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{error}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                User <code>dashboard_reader</code> belum memiliki akses ke schema ini.<br />
                Hubungi admin database untuk memberikan akses.
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Tabel kosong</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg-primary)', position: 'sticky', top: 0, zIndex: 1 }}>
                  {columns.map((c) => (
                    <th key={c.column_name} style={{
                      padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                      color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.column_name}
                      <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>{c.data_type.split(' ')[0]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    {columns.map((c) => (
                      <td key={c.column_name} style={{
                        padding: '7px 12px', color: 'var(--text-primary)',
                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                        maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }} title={String(row[c.column_name] ?? '')}>
                        {row[c.column_name] === null || row[c.column_name] === undefined
                          ? <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>NULL</span>
                          : String(row[c.column_name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setPage(1)} disabled={page === 1} style={pageBtnStyle(page === 1)}>«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={pageBtnStyle(page === 1)}>‹</button>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '0 12px' }}>Halaman {page} dari {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pageBtnStyle(page === totalPages)}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pageBtnStyle(page === totalPages)}>»</button>
          </div>
        )}
      </div>
    </div>
  );
}

function pageBtnStyle(disabled: boolean) {
  return {
    padding: '4px 10px', borderRadius: 6, fontSize: 13, cursor: disabled ? 'default' : 'pointer',
    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
    opacity: disabled ? 0.5 : 1,
  };
}

// ─── Main BigData Explorer Page ────────────────────────────────────
export default function BigdataPage() {
  const [schemas, setSchemas] = useState<BigdataSchema[]>([]);
  const [tables, setTables] = useState<BigdataTable[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);
  const [loadingSchemas, setLoadingSchemas] = useState(true);
  const [loadingTables, setLoadingTables] = useState(false);
  const [searchSchema, setSearchSchema] = useState('');
  const [searchTable, setSearchTable] = useState('');
  const [viewerTarget, setViewerTarget] = useState<{ schema: string; table: string; datasetName: string | null; datasetSlug: string | null } | null>(null);

  // Fetch schemas on mount
  useEffect(() => {
    fetch('/api/bigdata/schemas')
      .then((r) => r.json())
      .then((j) => { setSchemas(j.schemas ?? []); setLoadingSchemas(false); })
      .catch(() => setLoadingSchemas(false));
  }, []);

  // Fetch tables when schema selected
  const handleSelectSchema = useCallback(async (schema: string) => {
    setSelectedSchema(schema);
    setTables([]);
    setSearchTable('');
    setLoadingTables(true);
    try {
      const res = await fetch(`/api/bigdata/${encodeURIComponent(schema)}/tables`);
      const json = await res.json();
      setTables(json.tables ?? []);
    } catch {
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  }, []);

  const filteredSchemas = searchSchema
    ? schemas.filter((s) => (s.org_name ?? s.schema_name).toLowerCase().includes(searchSchema.toLowerCase()))
    : schemas;

  const filteredTables = searchTable
    ? tables.filter((t) => (t.dataset_name ?? t.table_name).toLowerCase().includes(searchTable.toLowerCase()))
    : tables;

  const orphanTables = filteredTables.filter((t) => !t.dataset_id);
  const linkedTables = filteredTables.filter((t) => t.dataset_id);

  const totalRows = schemas.reduce((s, sc) => s + sc.table_count, 0);
  const totalLinked = tables.filter((t) => t.dataset_id).length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">📦 BigData Explorer</h1>
        <p className="page-subtitle">Jelajahi database <code>replikasipdj-bigdata</code> — {schemas.length} schema, {totalRows} tabel</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { icon: '🏢', label: 'Total Schema', value: schemas.length, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { icon: '📋', label: 'Total Tabel', value: schemas.reduce((s, sc) => s + sc.table_count, 0), color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
          { icon: '🔗', label: 'Tabel Terhubung', value: selectedSchema ? linkedTables.length : '—', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
          { icon: '⚠️', label: 'Tabel Orphan', value: selectedSchema ? orphanTables.length : '—', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
        ].map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-card-header"><div className="stat-card-icon" style={{ background: c.bg }}>{c.icon}</div></div>
            <div className="stat-card-value" style={{ color: c.color }}>{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Two-pane layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>

        {/* Left: Schema Browser */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)' }}>🏢 Daftar OPD / Schema</div>
            <input
              value={searchSchema}
              onChange={(e) => setSearchSchema(e.target.value)}
              placeholder="Cari OPD..."
              style={{
                width: '100%', padding: '6px 10px',
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                borderRadius: 6, color: 'var(--text-primary)', fontSize: 12, boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ maxHeight: 580, overflowY: 'auto' }}>
            {loadingSchemas ? (
              [...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 52, margin: '4px 12px', borderRadius: 6 }} />)
            ) : filteredSchemas.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Tidak ada schema ditemukan</div>
            ) : (
              filteredSchemas.map((s) => (
                <button
                  key={s.schema_name}
                  onClick={() => handleSelectSchema(s.schema_name)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 16px',
                    background: selectedSchema === s.schema_name ? 'rgba(59,130,246,0.1)' : 'transparent',
                    border: 'none',
                    borderLeft: `3px solid ${selectedSchema === s.schema_name ? '#3b82f6' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontWeight: selectedSchema === s.schema_name ? 600 : 400, fontSize: 12, color: selectedSchema === s.schema_name ? '#3b82f6' : 'var(--text-primary)', lineHeight: 1.3 }}>
                    {s.org_name ?? formatSchemaName(s.schema_name)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 10 }}>
                    <span>📋 {s.table_count} tabel</span>
                    {s.dataset_count > 0 && <span>🔗 {s.dataset_count} dataset</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Table List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)' }}>
                {selectedSchema
                  ? <>📂 {schemas.find((s) => s.schema_name === selectedSchema)?.org_name ?? formatSchemaName(selectedSchema)}</>
                  : '← Pilih OPD di sebelah kiri'}
              </div>
              {selectedSchema && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {filteredTables.length} tabel · {linkedTables.length} terhubung ke dataset · {orphanTables.length} orphan
                </div>
              )}
            </div>
            {selectedSchema && (
              <input
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Cari tabel atau dataset..."
                style={{
                  width: 240, padding: '6px 10px',
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
                }}
              />
            )}
          </div>

          {!selectedSchema ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <div>Pilih OPD/Schema dari panel kiri untuk melihat daftar tabel</div>
            </div>
          ) : loadingTables ? (
            <div style={{ padding: '12px 16px' }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 6, borderRadius: 6 }} />)}
            </div>
          ) : filteredTables.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Tidak ada tabel</div>
          ) : (
            <div style={{ maxHeight: 580, overflowY: 'auto' }}>
              {/* Linked Tables */}
              {linkedTables.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#10b981', letterSpacing: 1, background: 'rgba(16,185,129,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                    🔗 TERHUBUNG KE DATASET ({linkedTables.length})
                  </div>
                  {linkedTables.map((t) => (
                    <TableRow key={t.table_name} t={t} onView={() => setViewerTarget({ schema: t.schema_name, table: t.table_name, datasetName: t.dataset_name, datasetSlug: t.dataset_slug })} />
                  ))}
                </>
              )}
              {/* Orphan Tables */}
              {orphanTables.length > 0 && (
                <>
                  <div style={{ padding: '8px 16px', fontSize: 10, fontWeight: 700, color: '#f59e0b', letterSpacing: 1, background: 'rgba(245,158,11,0.05)', borderBottom: '1px solid var(--border-subtle)' }}>
                    ⚠️ ORPHAN — BELUM ADA DATASET ({orphanTables.length})
                  </div>
                  {orphanTables.map((t) => (
                    <TableRow key={t.table_name} t={t} onView={() => setViewerTarget({ schema: t.schema_name, table: t.table_name, datasetName: null, datasetSlug: null })} />
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data Viewer Modal */}
      {viewerTarget && (
        <DataViewerModal
          schema={viewerTarget.schema}
          table={viewerTarget.table}
          datasetName={viewerTarget.datasetName}
          datasetSlug={viewerTarget.datasetSlug}
          onClose={() => setViewerTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Table Row Component ───────────────────────────────────────────
function TableRow({ t, onView }: { t: BigdataTable; onView: () => void }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto',
      gap: 12, alignItems: 'center',
      padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
      transition: 'background 0.1s',
    }}
      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {t.dataset_name ?? formatTableName(t.table_name)}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
          <code style={{ color: 'var(--text-muted)' }}>{t.table_name}</code>
          {t.row_count !== null && <span>~{formatNumber(t.row_count)} baris</span>}
          {t.col_count !== null && t.col_count > 0 && <span>{t.col_count} kolom</span>}
          {t.dataset_slug && (
            <a href={`${OPENDATA_URL}/${t.dataset_slug}`} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: 'var(--primary-400)', textDecoration: 'none' }}
              onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
              onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
            >🔗 Buka Portal</a>
          )}
        </div>
      </div>
      <button onClick={onView} style={{
        padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
        color: '#3b82f6', fontWeight: 600, whiteSpace: 'nowrap',
      }}>
        👁 Lihat Data
      </button>
    </div>
  );
}
