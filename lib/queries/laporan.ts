import { queryReplika } from '@/lib/db/replika';

export interface MonthlyReport {
  bulan: string;
  dataset_baru: number;
  dataset_diupdate: number;
  avg_score: number | null;
}

export interface YearlyReport {
  tahun: number;
  total_dataset: number;
  approved: number;
  pct_approved: number;
}

export interface OrgReport {
  organisasi: string;
  total_dataset: number;
  approved: number;
  pct_approved: number;
  avg_score: number | null;
}

export interface ReportSummary {
  total_dataset: number;
  total_approved: number;
  total_orgs: number;
  avg_score: number | null;
  dataset_this_month: number;
  dataset_this_year: number;
}

// Summary stats for report header
export async function getReportSummary(): Promise<ReportSummary> {
  const rows = await queryReplika<{
    total_dataset: string;
    total_approved: string;
    total_orgs: string;
    avg_score: string;
    dataset_this_month: string;
    dataset_this_year: string;
  }>(`
    SELECT
      COUNT(*)                                                              AS total_dataset,
      COUNT(CASE WHEN validate = 'approve' THEN 1 END)                     AS total_approved,
      COUNT(DISTINCT organisasi_id)                                         AS total_orgs,
      ROUND(AVG(dqs.score)::numeric, 1)                                    AS avg_score,
      COUNT(CASE WHEN DATE_TRUNC('month', cdate) = DATE_TRUNC('month', NOW()) THEN 1 END) AS dataset_this_month,
      COUNT(CASE WHEN EXTRACT(YEAR FROM cdate) = EXTRACT(YEAR FROM NOW())  THEN 1 END)  AS dataset_this_year
    FROM datasets d
    LEFT JOIN LATERAL (
      SELECT score FROM data_quality_score WHERE dataset_id = d.id ORDER BY timestamp DESC LIMIT 1
    ) dqs ON true
    WHERE d.is_active = true AND d.is_deleted = false
  `);
  const r = rows[0];
  return {
    total_dataset:      parseInt(r?.total_dataset ?? '0'),
    total_approved:     parseInt(r?.total_approved ?? '0'),
    total_orgs:         parseInt(r?.total_orgs ?? '0'),
    avg_score:          r?.avg_score ? parseFloat(r.avg_score) : null,
    dataset_this_month: parseInt(r?.dataset_this_month ?? '0'),
    dataset_this_year:  parseInt(r?.dataset_this_year ?? '0'),
  };
}

// Monthly breakdown for the last N months
export async function getMonthlyReport(months: number = 12): Promise<MonthlyReport[]> {
  const rows = await queryReplika<{
    bulan: string;
    dataset_baru: string;
    dataset_diupdate: string;
    avg_score: string | null;
  }>(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', d.cdate), 'YYYY-MM') AS bulan,
      COUNT(*)                                           AS dataset_baru,
      COUNT(CASE WHEN d.mdate::date != d.cdate::date THEN 1 END) AS dataset_diupdate,
      ROUND(AVG(dqs.score)::numeric, 1)                AS avg_score
    FROM datasets d
    LEFT JOIN LATERAL (
      SELECT score FROM data_quality_score WHERE dataset_id = d.id ORDER BY timestamp DESC LIMIT 1
    ) dqs ON true
    WHERE d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'
      AND d.cdate >= NOW() - ($1 || ' months')::interval
    GROUP BY DATE_TRUNC('month', d.cdate)
    ORDER BY bulan DESC
  `, [months]);

  return rows.map((r) => ({
    bulan:            r.bulan,
    dataset_baru:     parseInt(r.dataset_baru),
    dataset_diupdate: parseInt(r.dataset_diupdate),
    avg_score:        r.avg_score != null ? parseFloat(String(r.avg_score)) : null,
  }));
}

// Yearly breakdown
export async function getYearlyReport(): Promise<YearlyReport[]> {
  const rows = await queryReplika<{
    tahun: string;
    total_dataset: string;
    approved: string;
  }>(`
    SELECT
      EXTRACT(YEAR FROM cdate)::int::text           AS tahun,
      COUNT(*)                                       AS total_dataset,
      COUNT(CASE WHEN validate = 'approve' THEN 1 END) AS approved
    FROM datasets
    WHERE is_active = true AND is_deleted = false
    GROUP BY EXTRACT(YEAR FROM cdate)
    ORDER BY tahun DESC
    LIMIT 5
  `);
  return rows.map((r) => {
    const total    = parseInt(r.total_dataset);
    const approved = parseInt(r.approved);
    return {
      tahun:        parseInt(r.tahun),
      total_dataset: total,
      approved,
      pct_approved:  total > 0 ? Math.round((approved / total) * 100) : 0,
    };
  });
}

// Per-organisation summary (for export and table)
export async function getOrgReport(): Promise<OrgReport[]> {
  const rows = await queryReplika<{
    organisasi: string;
    total_dataset: string;
    approved: string;
    avg_score: string | null;
  }>(`
    SELECT
      o.name                                                  AS organisasi,
      COUNT(d.id)                                             AS total_dataset,
      COUNT(CASE WHEN d.validate = 'approve' THEN 1 END)     AS approved,
      ROUND(AVG(dqs.score)::numeric, 1)                      AS avg_score
    FROM datasets d
    JOIN organisasi o ON d.organisasi_id = o.id
    LEFT JOIN LATERAL (
      SELECT score FROM data_quality_score WHERE dataset_id = d.id ORDER BY timestamp DESC LIMIT 1
    ) dqs ON true
    WHERE d.is_active = true AND d.is_deleted = false
    GROUP BY o.name
    ORDER BY total_dataset DESC
  `);
  return rows.map((r) => {
    const total    = parseInt(r.total_dataset);
    const approved = parseInt(r.approved);
    return {
      organisasi:  r.organisasi,
      total_dataset: total,
      approved,
      pct_approved:  total > 0 ? Math.round((approved / total) * 100) : 0,
      avg_score:   r.avg_score != null ? parseFloat(String(r.avg_score)) : null,
    };
  });
}
