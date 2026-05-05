'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const OPENDATA_URL = 'https://satudata.kotabogor.go.id/dataset';

interface PriorityItem {
  id: string;
  name: string;
  organisasi_name: string;
  dataset_id: number | null;
  dataset_name: string | null;
  dataset_slug: string | null;
}

interface DatasetResult {
  id: number;
  name: string;
  slug: string;
  organisasi_name: string;
  topik_name: string;
  dimensi_awal: string | null;
  dimensi_akhir: string | null;
}

interface Props {
  item: PriorityItem;
  onClose: () => void;
  onMapped: (priorityId: string, datasetId: number | null, datasetName: string | null) => void;
}

export default function DatasetSearchModal({ item, onClose, onMapped }: Props) {
  const [query, setQuery] = useState(item.name);
  const [results, setResults] = useState<DatasetResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/prioritas/search-dataset?q=${encodeURIComponent(q.trim())}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setResults(json.results || []);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'Gagal mencari dataset');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    search(item.name);
  }, [item.name, search]);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = async (dataset: DatasetResult | null) => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/prioritas/map-dataset', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priority_id: item.id,
          dataset_id: dataset?.id ?? null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Gagal menyimpan');
      onMapped(item.id, dataset?.id ?? null, dataset?.name ?? null);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Gagal menyimpan mapping');
    } finally {
      setSaving(false);
      setSelectedId(null);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1001,
        width: '100%',
        maxWidth: 620,
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--bg-card-border)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '82vh',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--bg-card-border)',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Mapping Dataset untuk:
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
                {item.organisasi_name}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--bg-card-border)',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '5px',
                borderRadius: 'var(--radius-md)',
                lineHeight: 1,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              title="Tutup (Esc)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Current mapping badge */}
          {item.dataset_id && item.dataset_name && (
            <div style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span style={{ color: 'var(--status-success)', fontSize: 13 }}>✓</span>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.dataset_name}
                </span>
              </div>
              <button
                onClick={() => handleSelect(null)}
                disabled={saving}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239,68,68,0.35)',
                  borderRadius: 6,
                  color: 'var(--status-danger)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {saving ? 'Menyimpan...' : 'Hapus Mapping'}
              </button>
            </div>
          )}
        </div>

        {/* Search Input */}
        <div style={{ padding: '14px 20px 10px', flexShrink: 0, background: 'var(--bg-secondary)' }}>
          <div style={{ position: 'relative' }}>
            <svg
              width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
              style={{
                position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-muted)', pointerEvents: 'none',
              }}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Ketik nama dataset..."
              style={{
                width: '100%',
                padding: '9px 36px 9px 33px',
                background: 'var(--bg-input)',
                border: '1px solid var(--bg-card-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
            {searching && (
              <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5"
                  style={{ animation: 'spin 1s linear infinite', display: 'block' }}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21v-5h5" />
                </svg>
              </span>
            )}
          </div>
          {searchError && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--status-danger)', fontWeight: 500 }}>
              ⚠️ {searchError}
            </div>
          )}
        </div>

        {/* Save Error Banner — conflict atau error lainnya */}
        {saveError && (
          <div style={{
            margin: '0 20px 10px',
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            color: '#dc2626',
            fontWeight: 500,
            lineHeight: 1.5,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>⚠️</span>
            <span>{saveError}</span>
          </div>
        )}

        {/* Results */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: '4px 20px 16px',
          background: 'var(--bg-secondary)',
        }}>
          {!searching && results.length === 0 && query.trim().length >= 2 && (
            <div style={{
              textAlign: 'center',
              padding: '36px 0',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>🔍</div>
              <div>Tidak ada dataset cocok dengan</div>
              <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: 4 }}>
                &ldquo;{query}&rdquo;
              </div>
            </div>
          )}
          {!searching && results.length === 0 && query.trim().length < 2 && (
            <div style={{
              textAlign: 'center',
              padding: '36px 0',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}>
              Ketik minimal 2 karakter untuk mencari dataset
            </div>
          )}

          {results.map((ds) => {
            const isCurrentMapping = ds.id === item.dataset_id;
            const isSelected = ds.id === selectedId;
            return (
              <div
                key={ds.id}
                style={{
                  padding: '10px 12px',
                  marginBottom: 5,
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isCurrentMapping ? 'rgba(16,185,129,0.3)' : 'var(--bg-card-border)'}`,
                  background: isCurrentMapping
                    ? 'rgba(16,185,129,0.06)'
                    : 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isCurrentMapping) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(16,185,129,0.4)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrentMapping) {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--bg-card-border)';
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
                  }
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 13,
                    lineHeight: 1.4,
                  }}>
                    <a
                      href={`${OPENDATA_URL}/${ds.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: 'var(--dataset-link-color)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                      onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'underline'; }}
                      onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = 'none'; }}
                    >
                      {ds.name}
                    </a>
                    {isCurrentMapping && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        color: 'var(--status-success)',
                        background: 'rgba(16,185,129,0.12)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        verticalAlign: 'middle',
                      }}>
                        AKTIF
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{ds.organisasi_name}</span>
                    {ds.topik_name && (
                      <span style={{
                        padding: '1px 6px',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--bg-card-border)',
                        borderRadius: 4,
                        fontSize: 10,
                        color: 'var(--text-muted)',
                      }}>
                        {ds.topik_name}
                      </span>
                    )}
                  </div>
                  {(ds.dimensi_awal || ds.dimensi_akhir) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                      {ds.dimensi_awal && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          background: 'rgba(59,130,246,0.08)',
                          border: '1px solid rgba(59,130,246,0.2)',
                          borderRadius: 4,
                          padding: '1px 7px',
                        }}>
                          Awal: {ds.dimensi_awal}
                        </span>
                      )}
                      {ds.dimensi_awal && ds.dimensi_akhir && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                      {ds.dimensi_akhir && (
                        <span style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: 'var(--text-secondary)',
                          background: 'rgba(16,185,129,0.08)',
                          border: '1px solid rgba(16,185,129,0.2)',
                          borderRadius: 4,
                          padding: '1px 7px',
                        }}>
                          Akhir: {ds.dimensi_akhir}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setSelectedId(ds.id); handleSelect(ds); }}
                  disabled={saving || isCurrentMapping}
                  style={{
                    flexShrink: 0,
                    padding: '5px 14px',
                    background: isCurrentMapping ? 'transparent' : 'var(--primary-500)',
                    color: isCurrentMapping ? 'var(--status-success)' : 'white',
                    border: isCurrentMapping ? '1px solid rgba(16,185,129,0.3)' : 'none',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: (saving || isCurrentMapping) ? 'default' : 'pointer',
                    opacity: saving && isSelected ? 0.6 : 1,
                    transition: 'opacity 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {saving && isSelected ? 'Menyimpan...' : isCurrentMapping ? '✓ Aktif' : 'Pilih'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
