import { queryReplika } from '@/lib/db/replika';

export interface KlasifikasiSummaryRow {
  klasifikasi: string;
  total: number;
  approved: number;
  pct_approved: number;
  avg_score: number | null;
  total_views: number;
  total_downloads: number;
}

export interface DatasetByKlasifikasiRow {
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

export interface KlasifikasiTopikRow {
  klasifikasi: string;
  topik_name: string;
  total: number;
}

export async function getKlasifikasiSummary(): Promise<KlasifikasiSummaryRow[]> {
  const rows = await queryReplika<{
    klasifikasi: string;
    total: string;
    approved: string;
    avg_score: string | null;
    total_views: string;
    total_downloads: string;
  }>(
    `SELECT
      COALESCE(NULLIF(TRIM(d.klasifikasi), ''), 'Tidak Ditentukan') AS klasifikasi,
      COUNT(d.id)::text                                             AS total,
      COUNT(CASE WHEN d.validate = 'approve' THEN 1 END)::text     AS approved,
      ROUND(AVG(dqs.score)::numeric, 1)::text                      AS avg_score,
      SUM(COALESCE(d.count_view_opendata, 0))::text                AS total_views,
      SUM(COALESCE(d.count_download_opendata, 0))::text            AS total_downloads
    FROM datasets d
    LEFT JOIN LATERAL (
      SELECT score FROM data_quality_score
      WHERE dataset_id = d.id ORDER BY timestamp DESC LIMIT 1
    ) dqs ON true
    WHERE d.is_deleted = false AND d.is_active = true AND d.validate = 'approve'
    GROUP BY 1
    ORDER BY COUNT(d.id) DESC`
  );

  return rows.map((r) => {
    const total = parseInt(r.total);
    const approved = parseInt(r.approved);
    return {
      klasifikasi: r.klasifikasi,
      total,
      approved,
      pct_approved: total > 0 ? Math.round((approved / total) * 1000) / 10 : 0,
      avg_score: r.avg_score != null ? parseFloat(r.avg_score) : null,
      total_views: parseInt(r.total_views),
      total_downloads: parseInt(r.total_downloads),
    };
  });
}

export async function getDatasetsByKlasifikasi(
  klasifikasi?: string
): Promise<DatasetByKlasifikasiRow[]> {
  const params: unknown[] = [];
  const extra = klasifikasi
    ? `AND COALESCE(NULLIF(TRIM(d.klasifikasi), ''), 'Tidak Ditentukan') = $1`
    : '';
  if (klasifikasi) params.push(klasifikasi);

  return queryReplika<DatasetByKlasifikasiRow>(
    `SELECT
      d.id,
      d.name,
      d.slug,
      COALESCE(o.name, '—')   AS organisasi_name,
      COALESCE(NULLIF(TRIM(d.klasifikasi), ''), 'Tidak Ditentukan') AS klasifikasi,
      COALESCE(d.kategori, '—') AS kategori,
      COALESCE(t.name, '—')   AS topik_name,
      d.validate,
      dqs.score               AS qs_score,
      dqs.status              AS qs_status,
      COALESCE(d.count_view_opendata, 0)     AS count_view,
      COALESCE(d.count_download_opendata, 0) AS count_download,
      d.mdate,
      d.cdate
    FROM datasets d
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    LEFT JOIN topik t ON d.topik_id = t.id
    LEFT JOIN LATERAL (
      SELECT score, status FROM data_quality_score
      WHERE dataset_id = d.id ORDER BY timestamp DESC LIMIT 1
    ) dqs ON true
    WHERE d.is_deleted = false AND d.is_active = true ${extra}
    ORDER BY d.mdate DESC`,
    params
  );
}

export async function getKlasifikasiTopikBreakdown(): Promise<KlasifikasiTopikRow[]> {
  return queryReplika<KlasifikasiTopikRow>(
    `SELECT
      COALESCE(NULLIF(TRIM(d.klasifikasi), ''), 'Tidak Ditentukan') AS klasifikasi,
      COALESCE(t.name, 'Tanpa Topik') AS topik_name,
      COUNT(d.id) AS total
    FROM datasets d
    LEFT JOIN topik t ON d.topik_id = t.id
    WHERE d.is_deleted = false AND d.is_active = true
    GROUP BY 1, 2
    ORDER BY 1, COUNT(d.id) DESC`
  );
}
