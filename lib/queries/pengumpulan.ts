import { queryReplika } from '@/lib/db/replika';

export interface PengumpulanOrg {
  organisasi_id: number;
  organisasi_name: string;
  year: number;
  total_priority: number;
  fulfilled: number;
  unfulfilled: number;
  percentage: number;
}

export async function getPengumpulanData(year?: number): Promise<PengumpulanOrg[]> {
  const targetYear = year || new Date().getFullYear() - 1;

  const rows = await queryReplika<{
    organisasi_id: string;
    organisasi_name: string;
    year: string;
    total_priority: string;
    fulfilled: string;
    unfulfilled: string;
    percentage: string;
  }>(
    `SELECT
      dp.organization_id as organisasi_id,
      o.name as organisasi_name,
      dp.year,
      COUNT(*) as total_priority,
      COUNT(
        CASE WHEN dp.dataset_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM datasets d
            WHERE d.id = dp.dataset_id
              AND d.is_active = true
              AND d.is_deleted = false
              AND d.validate = 'approve'
          )
        THEN 1 END
      ) as fulfilled,
      COUNT(
        CASE WHEN dp.dataset_id IS NULL
          OR NOT EXISTS (
            SELECT 1 FROM datasets d
            WHERE d.id = dp.dataset_id
              AND d.is_active = true
              AND d.is_deleted = false
              AND d.validate = 'approve'
          )
        THEN 1 END
      ) as unfulfilled,
      ROUND(
        COALESCE(
          COUNT(
            CASE WHEN dp.dataset_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM datasets d
                WHERE d.id = dp.dataset_id
                  AND d.is_active = true
                  AND d.is_deleted = false
                  AND d.validate = 'approve'
              )
            THEN 1 END
          )::numeric /
          NULLIF(COUNT(*)::numeric, 0) * 100, 0
        ), 1
      ) as percentage
    FROM data_priority dp
    LEFT JOIN organisasi o ON dp.organization_id = o.id
    WHERE dp.year = $1
      AND dp.is_active = true
      AND dp.is_deleted = false
    GROUP BY dp.organization_id, o.name, dp.year
    ORDER BY percentage DESC`,
    [targetYear]
  );

  return rows.map((r) => ({
    organisasi_id: parseInt(r.organisasi_id),
    organisasi_name: r.organisasi_name,
    year: parseInt(r.year),
    total_priority: parseInt(r.total_priority),
    fulfilled: parseInt(r.fulfilled),
    unfulfilled: parseInt(r.unfulfilled),
    percentage: parseFloat(r.percentage),
  }));
}

export interface PengumpulanSummary {
  year: number;
  total_priority: number;
  fulfilled: number;
  percentage: number;
  total_orgs: number;
}

export async function getPengumpulanYearly(years: number = 5): Promise<PengumpulanSummary[]> {
  const currentYear = new Date().getFullYear();
  // Data mundur 1 tahun: dari (currentYear-years) s/d (currentYear-1)
  const startYear = currentYear - years;
  const endYear = currentYear - 1;

  const rows = await queryReplika<{
    year: string;
    total_priority: string;
    fulfilled: string;
    percentage: string;
    total_orgs: string;
  }>(
    `SELECT
      dp.year,
      COUNT(*) as total_priority,
      COUNT(
        CASE WHEN dp.dataset_id IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM datasets d
            WHERE d.id = dp.dataset_id
              AND d.is_active = true
              AND d.is_deleted = false
              AND d.validate = 'approve'
          )
        THEN 1 END
      ) as fulfilled,
      ROUND(
        COALESCE(
          COUNT(
            CASE WHEN dp.dataset_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM datasets d
                WHERE d.id = dp.dataset_id
                  AND d.is_active = true
                  AND d.is_deleted = false
                  AND d.validate = 'approve'
              )
            THEN 1 END
          )::numeric /
          NULLIF(COUNT(*)::numeric, 0) * 100, 0
        ), 1
      ) as percentage,
      COUNT(DISTINCT dp.organization_id) as total_orgs
    FROM data_priority dp
    WHERE dp.year >= $1 AND dp.year <= $2
      AND dp.is_active = true AND dp.is_deleted = false
    GROUP BY dp.year
    ORDER BY dp.year ASC`,
    [startYear, endYear]
  );

  return rows.map((r) => ({
    year: parseInt(r.year),
    total_priority: parseInt(r.total_priority),
    fulfilled: parseInt(r.fulfilled),
    percentage: parseFloat(r.percentage),
    total_orgs: parseInt(r.total_orgs),
  }));
}

export async function getAvailableYears(): Promise<number[]> {
  const rows = await queryReplika<{ year: string }>(
    `SELECT DISTINCT year FROM data_priority
     WHERE is_active = true AND is_deleted = false
     ORDER BY year DESC`
  );
  return rows.map((r) => parseInt(r.year));
}

// ─── Unlinked datasets (not connected to data_priority) ────────────
export interface UnlinkedOPD {
  opd: string;
  total: number;
  belum_linked: number;
  pct_linked: number;
}

export interface UnlinkedStats {
  total_datasets: number;
  linked:         number;
  not_linked:     number;
  pct_linked:     number;
  baru_30hari:    number;  // dataset baru (<30 hari) dan belum linked
  diupdate_belum_linked: number; // pernah diupdate & belum linked
  top_opd: UnlinkedOPD[];
}

export async function getUnlinkedStats(): Promise<UnlinkedStats> {
  const [summaryRows, opdRows] = await Promise.all([
    queryReplika<{
      total_datasets: string;
      linked: string;
      not_linked: string;
      baru_30hari: string;
      diupdate_belum_linked: string;
    }>(`
      SELECT
        COUNT(*)                                                                            AS total_datasets,
        COUNT(dp.dataset_id)                                                                AS linked,
        COUNT(*) - COUNT(dp.dataset_id)                                                    AS not_linked,
        COUNT(CASE WHEN dp.dataset_id IS NULL AND d.cdate >= NOW() - INTERVAL '30 days' THEN 1 END) AS baru_30hari,
        COUNT(CASE WHEN dp.dataset_id IS NULL AND d.mdate::date > d.cdate::date          THEN 1 END) AS diupdate_belum_linked
      FROM datasets d
      LEFT JOIN (SELECT DISTINCT dataset_id FROM data_priority) dp ON dp.dataset_id = d.id
      WHERE d.is_active = true AND d.is_deleted = false
    `),

    queryReplika<{
      opd: string;
      total: string;
      belum_linked: string;
    }>(`
      SELECT
        o.name                                                              AS opd,
        COUNT(d.id)                                                         AS total,
        COUNT(CASE WHEN dp.dataset_id IS NULL THEN 1 END)                  AS belum_linked
      FROM datasets d
      JOIN organisasi o ON o.id = d.organisasi_id
      LEFT JOIN (SELECT DISTINCT dataset_id FROM data_priority) dp ON dp.dataset_id = d.id
      WHERE d.is_active = true AND d.is_deleted = false
      GROUP BY o.name
      HAVING COUNT(CASE WHEN dp.dataset_id IS NULL THEN 1 END) > 0
      ORDER BY belum_linked DESC
      LIMIT 10
    `),
  ]);

  const s = summaryRows[0];
  const total    = parseInt(s?.total_datasets ?? '0');
  const linked   = parseInt(s?.linked         ?? '0');
  const notLinked = parseInt(s?.not_linked    ?? '0');

  return {
    total_datasets: total,
    linked,
    not_linked:     notLinked,
    pct_linked:     total > 0 ? Math.round((linked / total) * 100) : 0,
    baru_30hari:    parseInt(s?.baru_30hari            ?? '0'),
    diupdate_belum_linked: parseInt(s?.diupdate_belum_linked ?? '0'),
    top_opd: opdRows.map((r) => {
      const tot = parseInt(r.total);
      const bl  = parseInt(r.belum_linked);
      return {
        opd:          r.opd,
        total:        tot,
        belum_linked: bl,
        pct_linked:   tot > 0 ? Math.round(((tot - bl) / tot) * 100) : 0,
      };
    }),
  };
}
