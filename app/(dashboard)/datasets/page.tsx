'use client';

import React, { useEffect, useState, useCallback } from 'react';
import DataTable from '@/components/ui/DataTable';
import FilterBar from '@/components/ui/FilterBar';
import { formatDate, formatRelativeTime, formatDateTime, truncateText, getScoreColor, getScoreLabel } from '@/lib/utils/format';

interface DatasetRow {
  id: number;
  name: string;
  slug: string;
  organisasi_name: string;
  topik_name: string;
  periode: string;
  kategori: string;
  klasifikasi: string;
  is_active: boolean;
  validate: string | null;
  data_score_status: string | null;
  count_view_opendata: number;
  count_download_opendata: number;
  cdate: string;
  mdate: string;
  // Quality score dari data_quality_score
  qs_score: number | null;
  qs_status: string | null;
  qs_completeness: number | null;
  qs_conformity: number | null;
  qs_timeliness: number | null;
  qs_uniqueness: number | null;
  qs_consistency: number | null;
  // Dimensi dari datasets_metadata
  dimensi_awal: string | null;
  dimensi_akhir: string | null;
  // Tahun data prioritas
  priority_years: number[] | null;
}

interface HistoryItem {
  id: number;
  dataset_id: number;
  type: string;
  notes: string;
  username: string;
  cdate: string;
}

interface OrgOption { id: number; name: string; }
interface TopikOption { id: number; name: string; }

const OPENDATA_URL = 'https://satudata.kotabogor.go.id/dataset';

// Demo data
const demoDatasets = ([
  { id: 1, name: 'Jumlah Penduduk per Kecamatan 2026', slug: 'jumlah-penduduk-per-kecamatan-2026', organisasi_name: 'Dinas Kependudukan dan Pencatatan Sipil', topik_name: 'Kependudukan', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'change', data_score_status: 'sangat_baik', count_view_opendata: 1250, count_download_opendata: 340, cdate: new Date(Date.now() - 86400000).toISOString(), mdate: new Date(Date.now() - 86400000).toISOString(), qs_score: 92, qs_status: 'sangat_baik', qs_completeness: 95, qs_conformity: 90, qs_timeliness: 93, qs_uniqueness: 100, qs_consistency: 88 },
  { id: 2, name: 'Data Puskesmas Kota Bogor', slug: 'data-puskesmas-kota-bogor', organisasi_name: 'Dinas Kesehatan', topik_name: 'Kesehatan', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'edit', data_score_status: 'baik', count_view_opendata: 890, count_download_opendata: 210, cdate: new Date(Date.now() - 172800000).toISOString(), mdate: new Date(Date.now() - 3600000).toISOString(), qs_score: 78, qs_status: 'baik', qs_completeness: 80, qs_conformity: 75, qs_timeliness: 82, qs_uniqueness: 90, qs_consistency: 70 },
  { id: 3, name: 'Realisasi APBD Kota Bogor 2025', slug: 'realisasi-apbd-kota-bogor-2025', organisasi_name: 'Badan Keuangan dan Aset Daerah', topik_name: 'Keuangan', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'change', data_score_status: 'sangat_baik', count_view_opendata: 2100, count_download_opendata: 560, cdate: new Date(Date.now() - 259200000).toISOString(), mdate: new Date(Date.now() - 7200000).toISOString(), qs_score: 95, qs_status: 'sangat_baik', qs_completeness: 98, qs_conformity: 95, qs_timeliness: 94, qs_uniqueness: 100, qs_consistency: 92 },
  { id: 4, name: 'Angka Partisipasi Kasar SD', slug: 'angka-partisipasi-kasar-sd', organisasi_name: 'Dinas Pendidikan', topik_name: 'Pendidikan', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: null, data_score_status: 'cukup', count_view_opendata: 430, count_download_opendata: 120, cdate: new Date(Date.now() - 345600000).toISOString(), mdate: new Date(Date.now() - 345600000).toISOString(), qs_score: 61, qs_status: 'cukup', qs_completeness: 65, qs_conformity: 58, qs_timeliness: 60, qs_uniqueness: 75, qs_consistency: 55 },
  { id: 5, name: 'Indeks Pembangunan Manusia', slug: 'indeks-pembangunan-manusia', organisasi_name: 'Badan Perencanaan Pembangunan Daerah', topik_name: 'Pembangunan', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'edit', data_score_status: 'baik', count_view_opendata: 1800, count_download_opendata: 480, cdate: new Date(Date.now() - 432000000).toISOString(), mdate: new Date(Date.now() - 14400000).toISOString(), qs_score: 82, qs_status: 'baik', qs_completeness: 85, qs_conformity: 80, qs_timeliness: 83, qs_uniqueness: 88, qs_consistency: 78 },
  { id: 6, name: 'Data Jalan Kota Bogor', slug: 'data-jalan-kota-bogor', organisasi_name: 'Dinas Pekerjaan Umum dan Penataan Ruang', topik_name: 'Infrastruktur', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: null, data_score_status: 'perlu_diperbaiki', count_view_opendata: 320, count_download_opendata: 89, cdate: new Date(Date.now() - 518400000).toISOString(), mdate: new Date(Date.now() - 518400000).toISOString(), qs_score: 42, qs_status: 'perlu_diperbaiki', qs_completeness: 40, qs_conformity: 38, qs_timeliness: 45, qs_uniqueness: 60, qs_consistency: 35 },
  { id: 7, name: 'Produksi Sampah per Kecamatan', slug: 'produksi-sampah-per-kecamatan', organisasi_name: 'Dinas Lingkungan Hidup', topik_name: 'Lingkungan', periode: 'Bulanan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'change', data_score_status: 'cukup', count_view_opendata: 670, count_download_opendata: 150, cdate: new Date(Date.now() - 604800000).toISOString(), mdate: new Date(Date.now() - 28800000).toISOString(), qs_score: 65, qs_status: 'cukup', qs_completeness: 68, qs_conformity: 62, qs_timeliness: 66, qs_uniqueness: 80, qs_consistency: 58 },
  { id: 8, name: 'Data UMKM Kota Bogor', slug: 'data-umkm-kota-bogor', organisasi_name: 'Dinas Koperasi dan UKM', topik_name: 'Ekonomi', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: null, data_score_status: null, count_view_opendata: 1450, count_download_opendata: 380, cdate: new Date(Date.now() - 691200000).toISOString(), mdate: new Date(Date.now() - 691200000).toISOString(), qs_score: null, qs_status: null, qs_completeness: null, qs_conformity: null, qs_timeliness: null, qs_uniqueness: null, qs_consistency: null },
  { id: 9, name: 'Tingkat Pengangguran Terbuka', slug: 'tingkat-pengangguran-terbuka', organisasi_name: 'Dinas Tenaga Kerja', topik_name: 'Ketenagakerjaan', periode: 'Semester', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'edit', data_score_status: 'baik', count_view_opendata: 980, count_download_opendata: 260, cdate: new Date(Date.now() - 1200000000).toISOString(), mdate: new Date(Date.now() - 43200000).toISOString(), qs_score: 76, qs_status: 'baik', qs_completeness: 78, qs_conformity: 74, qs_timeliness: 77, qs_uniqueness: 85, qs_consistency: 72 },
  { id: 10, name: 'Jumlah Sekolah per Jenjang', slug: 'jumlah-sekolah-per-jenjang', organisasi_name: 'Dinas Pendidikan', topik_name: 'Pendidikan', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'change', data_score_status: 'sangat_baik', count_view_opendata: 540, count_download_opendata: 130, cdate: new Date(Date.now() - 1500000000).toISOString(), mdate: new Date(Date.now() - 86400000).toISOString(), qs_score: 89, qs_status: 'sangat_baik', qs_completeness: 92, qs_conformity: 88, qs_timeliness: 90, qs_uniqueness: 95, qs_consistency: 85 },
  { id: 11, name: 'Data Pasar Tradisional', slug: 'data-pasar-tradisional', organisasi_name: 'Dinas Perdagangan dan Perindustrian', topik_name: 'Ekonomi', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: null, data_score_status: null, count_view_opendata: 290, count_download_opendata: 75, cdate: new Date(Date.now() - 2000000000).toISOString(), mdate: new Date(Date.now() - 2000000000).toISOString(), qs_score: null, qs_status: null, qs_completeness: null, qs_conformity: null, qs_timeliness: null, qs_uniqueness: null, qs_consistency: null, dimensi_awal: null, dimensi_akhir: null, priority_years: null },
  { id: 12, name: 'Luas Wilayah per Kecamatan', slug: 'luas-wilayah-per-kecamatan', organisasi_name: 'Dinas Pekerjaan Umum dan Penataan Ruang', topik_name: 'Infrastruktur', periode: 'Tahunan', kategori: 'Data', klasifikasi: 'Terbuka', is_active: true, validate: 'edit', data_score_status: 'cukup', count_view_opendata: 710, count_download_opendata: 195, cdate: new Date(Date.now() - 2500000000).toISOString(), mdate: new Date(Date.now() - 172800000).toISOString(), qs_score: 58, qs_status: 'cukup', qs_completeness: 60, qs_conformity: 55, qs_timeliness: 58, qs_uniqueness: 72, qs_consistency: 52, dimensi_awal: null, dimensi_akhir: null, priority_years: null },
] as DatasetRow[]);

const demoOrgs: OrgOption[] = [
  { id: 1, name: 'Dinas Kesehatan' }, { id: 2, name: 'Dinas Pendidikan' },
  { id: 3, name: 'Badan Keuangan dan Aset Daerah' }, { id: 4, name: 'Dinas Kependudukan dan Pencatatan Sipil' },
  { id: 5, name: 'Badan Perencanaan Pembangunan Daerah' }, { id: 6, name: 'Dinas Pekerjaan Umum dan Penataan Ruang' },
];

const demoTopik: TopikOption[] = [
  { id: 1, name: 'Kependudukan' }, { id: 2, name: 'Kesehatan' },
  { id: 3, name: 'Pendidikan' }, { id: 4, name: 'Ekonomi' },
  { id: 5, name: 'Infrastruktur' }, { id: 6, name: 'Keuangan' },
];

const demoHistory: HistoryItem[] = [
  { id: 1, dataset_id: 1, type: 'create', notes: 'Dataset pertama kali dibuat', username: 'admin_dukcapil', cdate: new Date(Date.now() - 2592000000).toISOString() },
  { id: 2, dataset_id: 1, type: 'edit', notes: 'Memperbarui data periode 2025', username: 'admin_dukcapil', cdate: new Date(Date.now() - 1296000000).toISOString() },
  { id: 3, dataset_id: 1, type: 'change', notes: 'Mengubah metadata klasifikasi', username: 'admin', cdate: new Date(Date.now() - 432000000).toISOString() },
  { id: 4, dataset_id: 1, type: 'edit', notes: 'Update data kuartal 1 2026', username: 'admin_dukcapil', cdate: new Date(Date.now() - 86400000).toISOString() },
];

function getScoreFromStatus(status: string | null): { score: number; label: string; color: string; displayLabel: string } {
  switch (status) {
    case 'sangat_baik': return { score: 90, label: 'A', displayLabel: 'Sangat Baik', color: getScoreColor(90) };
    case 'baik': return { score: 75, label: 'B', displayLabel: 'Baik', color: getScoreColor(75) };
    case 'cukup': return { score: 60, label: 'C', displayLabel: 'Cukup', color: getScoreColor(60) };
    case 'perlu_diperbaiki': return { score: 40, label: 'D', displayLabel: 'Perlu Diperbaiki', color: getScoreColor(40) };
    default: return { score: 0, label: '-', displayLabel: '-', color: 'var(--text-muted)' };
  }
}

function getHistoryIcon(type: string): string {
  switch (type) {
    case 'create': return '🟢';
    case 'edit': return '🔵';
    case 'change': return '🟠';
    case 'delete': return '🔴';
    default: return '⚪';
  }
}

function getHistoryLabel(type: string): string {
  switch (type) {
    case 'create': return 'Dibuat';
    case 'edit': return 'Diedit';
    case 'change': return 'Diubah';
    case 'delete': return 'Dihapus';
    default: return type;
  }
}

type TabType = 'all' | 'new' | 'updated';

function getDefaultDates() {
  const now = new Date();
  const year = now.getFullYear();
  const startDate = `${year}-01-01`;
  const today = now.toISOString().split('T')[0];
  return { start_date: startDate, end_date: today };
}

export default function DatasetsPage() {
  const [data, setData] = useState<DatasetRow[]>([]);
  const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
  const [topikOptions, setTopikOptions] = useState<TopikOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [tab, setTab] = useState<TabType>('all');
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const { start_date, end_date } = getDefaultDates();
    return { organisasi_id: '', topik_id: '', start_date, end_date };
  });

  // History modal
  const [historyModal, setHistoryModal] = useState<{
    open: boolean;
    datasetName: string;
    datasetId: number;
    items: HistoryItem[];
    loading: boolean;
  }>({ open: false, datasetName: '', datasetId: 0, items: [], loading: false });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('tab', tab);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/datasets?${params}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setData(json.datasets);
      setOrgOptions(json.organisasiOptions);
      setTopikOptions(json.topikOptions);
      setIsDemo(false);
    } catch {
      let filtered = [...demoDatasets];
      if (tab === 'new') {
        filtered = filtered.filter((d) => d.is_active && (d.validate === 'verification' || d.validate === 'new'));
      } else if (tab === 'updated') {
        filtered = filtered.filter((d) => d.is_active && (d.validate === 'change' || d.validate === 'edit'));
      }
      setData(filtered);
      setOrgOptions(demoOrgs);
      setTopikOptions(demoTopik);
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  }, [tab, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const { start_date, end_date } = getDefaultDates();
    setFilters({ organisasi_id: '', topik_id: '', start_date, end_date });
  };

  const handleLacak = async (row: DatasetRow) => {
    setHistoryModal({ open: true, datasetName: row.name, datasetId: row.id, items: [], loading: true });
    try {
      const res = await fetch(`/api/datasets?history_for=${row.id}`);
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setHistoryModal((prev) => ({ ...prev, items: json.history, loading: false }));
    } catch {
      // Demo fallback
      setHistoryModal((prev) => ({
        ...prev,
        items: demoHistory.map((h) => ({ ...h, dataset_id: row.id })),
        loading: false,
      }));
    }
  };

  const tabCounts = {
    all: data.length,
    new: isDemo ? demoDatasets.filter((d) => d.is_active && (d.validate === 'verification' || d.validate === 'new')).length : 0,
    updated: isDemo ? demoDatasets.filter((d) => d.is_active && (d.validate === 'change' || d.validate === 'edit')).length : 0,
  };

  const columns = [
    {
      key: 'name',
      label: 'Nama Dataset',
      width: '30%',
      render: (row: DatasetRow) => (
        <div>
          <a
            href={`${OPENDATA_URL}/${row.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontWeight: 500, color: 'var(--dataset-link-color)', textDecoration: 'none', lineHeight: 1.3, display: 'inline-block' }}
            onMouseOver={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
            onMouseOut={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
          >
            {row.name}
          </a>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {row.topik_name} • {row.periode}
          </div>
        </div>
      ),
    },
    {
      key: 'organisasi_name',
      label: 'Organisasi',
      width: '20%',
      render: (row: DatasetRow) => (
        <span style={{ fontSize: 12, lineHeight: 1.3, display: 'inline-block' }}>{row.organisasi_name}</span>
      ),
    },
    {
      key: 'klasifikasi',
      label: 'Klasifikasi',
      width: '9%',
      render: (row: DatasetRow) => (
        <span className={`badge ${row.klasifikasi === 'Terbuka' || row.klasifikasi === 'public' ? 'badge-success' : 'badge-warning'}`}>
          {row.klasifikasi}
        </span>
      ),
    },
    {
      key: 'qs_score',
      label: 'Skor Kualitas',
      width: '15%',
      render: (row: DatasetRow) => {
        const score = row.qs_score;
        const status = row.qs_status || row.data_score_status;
        if (score === null && !status) {
          return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
        }
        const scoreNum = score ?? 0;
        const color = scoreNum >= 80 ? '#10b981' : scoreNum >= 60 ? '#3b82f6' : scoreNum >= 40 ? '#f59e0b' : '#ef4444';
        const statusLabel = status === 'sangat_baik' ? 'Sangat Baik' : status === 'baik' ? 'Baik' : status === 'cukup' ? 'Cukup' : status === 'perlu_diperbaiki' ? 'Perlu Diperbaiki' : (status ?? '—');

        const dim = (label: string, val: number | null) => (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 11, padding: '2px 0' }}>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: val !== null ? (val >= 80 ? '#10b981' : val >= 60 ? '#3b82f6' : val >= 40 ? '#f59e0b' : '#ef4444') : '#64748b' }}>
              {val !== null ? `${val}` : '—'}
            </span>
          </div>
        );

        return (
          <div style={{ position: 'relative' }} className="qs-cell">
            {/* Tampilan utama */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 36, height: 22, borderRadius: 6, padding: '0 6px',
                  background: `${color}20`, color, fontWeight: 800, fontSize: 13,
                }}>
                  {scoreNum}
                </span>
                <span style={{ fontSize: 10, color, fontWeight: 600 }}>{statusLabel}</span>
              </div>
              {/* Mini bar 5 dimensi */}
              {row.qs_completeness !== null && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {[
                    { v: row.qs_completeness, t: 'C' },
                    { v: row.qs_conformity, t: 'F' },
                    { v: row.qs_timeliness, t: 'T' },
                    { v: row.qs_uniqueness, t: 'U' },
                    { v: row.qs_consistency, t: 'K' },
                  ].map(({ v, t }) => {
                    const c = v !== null ? (v >= 80 ? '#10b981' : v >= 60 ? '#3b82f6' : v >= 40 ? '#f59e0b' : '#ef4444') : '#1e293b';
                    return (
                      <div key={t} style={{ width: 16, textAlign: 'center' }}>
                        <div style={{ height: 3, borderRadius: 2, background: c, opacity: v !== null ? 1 : 0.2 }} />
                        <div style={{ fontSize: 8, color: 'var(--text-muted)', marginTop: 1 }}>{t}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Tooltip */}
            <div className="qs-tooltip">
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12, color: '#fff' }}>Skor Kualitas Data</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color }}>{scoreNum}</span>
                <span style={{ alignSelf: 'flex-end', fontSize: 11, color: color, fontWeight: 600 }}>{statusLabel}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 8 }}>
                {dim('Completeness', row.qs_completeness)}
                {dim('Conformity', row.qs_conformity)}
                {dim('Timeliness', row.qs_timeliness)}
                {dim('Uniqueness', row.qs_uniqueness)}
                {dim('Consistency', row.qs_consistency)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: tab === 'new' ? 'cdate' : 'mdate',
      label: tab === 'new' ? 'Dibuat' : 'Diupdate',
      width: '10%',
      render: (row: DatasetRow) => {
        const dateVal = tab === 'new' ? row.cdate : row.mdate;
        return (
          <div>
            <div style={{ fontSize: 12 }}>{formatDate(dateVal)}</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatRelativeTime(dateVal)}</div>
          </div>
        );
      },
    },
    {
      key: 'dimensi',
      label: 'Dimensi',
      width: '9%',
      render: (row: DatasetRow) => {
        if (!row.dimensi_awal && !row.dimensi_akhir) {
          return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
        }
        return (
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            {row.dimensi_awal && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Awal</span>
                <span style={{
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: 4,
                  padding: '0 5px',
                  fontSize: 11,
                }}>{row.dimensi_awal}</span>
              </div>
            )}
            {row.dimensi_akhir && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>Akhir</span>
                <span style={{
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 4,
                  padding: '0 5px',
                  fontSize: 11,
                }}>{row.dimensi_akhir}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'priority_years',
      label: 'Prioritas',
      width: '9%',
      render: (row: DatasetRow) => {
        const years = row.priority_years;
        if (!years || years.length === 0) {
          return <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {years.map((y) => (
              <span key={y} style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 4,
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.25)',
                color: '#8b5cf6',
              }}>{y}</span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'aksi',
      label: 'Aksi',
      width: '7%',
      sortable: false,
      render: (row: DatasetRow) => (
        <button
          className="btn-lacak"
          onClick={(e) => { e.stopPropagation(); handleLacak(row); }}
          title="Lacak history dataset"
        >
          🔍 Lacak
        </button>
      ),
    },
  ];

  const prevYear = new Date().getFullYear() - 1;
  const getRowStyle = (row: DatasetRow): React.CSSProperties => {
    if (row.dimensi_akhir && parseInt(row.dimensi_akhir, 10) === prevYear) {
      return { background: 'rgba(245,158,11,0.07)', borderLeft: '3px solid rgba(245,158,11,0.4)' };
    }
    return {};
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">📊 Monitoring Dataset</h1>
          <p className="page-subtitle">
            Pantau dataset baru dan pembaruan data
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

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          📋 Semua {tab === 'all' && <span className="tab-badge">{tabCounts.all}</span>}
        </button>
        <button className={`tab ${tab === 'new' ? 'active' : ''}`} onClick={() => setTab('new')}>
          🆕 Baru {tab === 'new' && <span className="tab-badge">{tabCounts.all}</span>}
        </button>
        <button className={`tab ${tab === 'updated' ? 'active' : ''}`} onClick={() => setTab('updated')}>
          🔄 Diupdate {tab === 'updated' && <span className="tab-badge">{tabCounts.all}</span>}
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={
          tab === 'all'
            ? [
                { key: 'organisasi_id', label: 'Organisasi', type: 'select', options: orgOptions.map((o) => ({ value: String(o.id), label: o.name })) },
                { key: 'topik_id', label: 'Topik', type: 'select', options: topikOptions.map((t) => ({ value: String(t.id), label: t.name })) },
              ]
            : [
                { key: 'organisasi_id', label: 'Organisasi', type: 'select', options: orgOptions.map((o) => ({ value: String(o.id), label: o.name })) },
                { key: 'topik_id', label: 'Topik', type: 'select', options: topikOptions.map((t) => ({ value: String(t.id), label: t.name })) },
                { key: 'start_date', label: 'Dari Tanggal', type: 'date' },
                { key: 'end_date', label: 'Sampai Tanggal', type: 'date' },
              ]
        }
        values={filters}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {/* Table */}
      <div className="card">
        {loading ? (
          <div>{[...Array(8)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div>
        ) : (
          <DataTable<DatasetRow>
            columns={columns}
            data={data}
            pageSize={25}
            searchPlaceholder="Cari nama dataset atau organisasi..."
            emptyMessage="Tidak ada dataset ditemukan"
            rowStyle={getRowStyle}
          />
        )}
      </div>

      {/* History Modal */}
      {historyModal.open && (
        <div className="modal-overlay" onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">🔍 History Dataset</h3>
                <p className="modal-subtitle">{historyModal.datasetName}</p>
              </div>
              <button
                className="modal-close"
                onClick={() => setHistoryModal((prev) => ({ ...prev, open: false }))}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {historyModal.loading ? (
                <div>{[...Array(4)].map((_, i) => <div key={i} className="skeleton skeleton-row" />)}</div>
              ) : historyModal.items.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div className="empty-state-icon">📭</div>
                  <div className="empty-state-title">Belum ada history</div>
                  <div className="empty-state-desc">Dataset ini belum memiliki catatan perubahan</div>
                </div>
              ) : (
                <div className="history-timeline">
                  {historyModal.items.map((item) => (
                    <div key={item.id} className="history-item">
                      <div className="history-icon">{getHistoryIcon(item.type)}</div>
                      <div className="history-content">
                        <div className="history-header">
                          <span className={`badge ${item.type === 'create' ? 'badge-success' : item.type === 'edit' ? 'badge-info' : item.type === 'change' ? 'badge-warning' : 'badge-danger'}`}>
                            {getHistoryLabel(item.type)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {formatDateTime(item.cdate)}
                          </span>
                        </div>
                        <p className="history-notes">{item.notes || 'Tidak ada catatan'}</p>
                        <span className="history-user">👤 {item.username}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
