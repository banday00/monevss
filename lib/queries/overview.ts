import { queryReplika, queryReplikaOne } from '@/lib/db/replika';

export interface OverviewStats {
  totalDatasets: number;
  totalOrganisasi: number;
  totalTopik: number;
  datasetsThisMonth: number;
  datasetsUpdatedThisMonth: number;
  avgQualityScore: number;
  priorityCoverage: number;
  totalViews: number;
  totalDownloads: number;
  totalPriority: number;
  fulfilledPriority: number;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfMonth = new Date(currentYear, now.getMonth(), 1).toISOString();

  const [
    totalDatasets,
    totalOrganisasi,
    totalTopik,
    datasetsThisMonth,
    datasetsUpdatedThisMonth,
    avgQuality,
    priorityCoverage,
    viewsDownloads,
  ] = await Promise.all([
    // Total datasets yang sudah approve
    queryReplikaOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM datasets WHERE is_active = true AND is_deleted = false AND validate = 'approve'`
    ),
    queryReplikaOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM organisasi WHERE is_active = true AND is_deleted = false`
    ),
    queryReplikaOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM topik WHERE is_active = true AND is_deleted = false`
    ),
    // Datasets baru bulan ini yang sudah approve
    queryReplikaOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM datasets WHERE cdate >= $1 AND is_active = true AND is_deleted = false AND validate = 'approve'`,
      [startOfMonth]
    ),
    // Datasets diupdate bulan ini yang sudah approve
    queryReplikaOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM datasets WHERE mdate >= $1 AND mdate != cdate AND is_active = true AND is_deleted = false AND validate = 'approve'`,
      [startOfMonth]
    ),
    queryReplikaOne<{ avg: string }>(
      `SELECT COALESCE(AVG(dqs.score), 0) as avg 
       FROM data_quality_score dqs
       JOIN datasets d ON dqs.dataset_id = d.id
       WHERE d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'`
    ),
    // Priority coverage — mundur 1 tahun, fulfilled hanya jika dataset approve
    queryReplikaOne<{ total: string; fulfilled: string }>(
      `SELECT 
        COUNT(*) as total,
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
        ) as fulfilled
      FROM data_priority dp
      WHERE dp.year = $1 AND dp.is_active = true AND dp.is_deleted = false`,
      [currentYear - 1]
    ),
    // Views/downloads hanya dari dataset approve
    queryReplikaOne<{ views: string; downloads: string }>(
      `SELECT 
        COALESCE(SUM(count_view_opendata + count_view_satudata), 0) as views,
        COALESCE(SUM(count_download_opendata + count_download_satudata), 0) as downloads
      FROM datasets WHERE is_active = true AND is_deleted = false AND validate = 'approve'`
    ),
  ]);

  const totalPriority = parseInt(priorityCoverage?.total || '0');
  const fulfilledPriority = parseInt(priorityCoverage?.fulfilled || '0');

  return {
    totalDatasets: parseInt(totalDatasets?.count || '0'),
    totalOrganisasi: parseInt(totalOrganisasi?.count || '0'),
    totalTopik: parseInt(totalTopik?.count || '0'),
    datasetsThisMonth: parseInt(datasetsThisMonth?.count || '0'),
    datasetsUpdatedThisMonth: parseInt(datasetsUpdatedThisMonth?.count || '0'),
    avgQualityScore: parseFloat(avgQuality?.avg || '0'),
    priorityCoverage: totalPriority > 0 ? (fulfilledPriority / totalPriority) * 100 : 0,
    totalViews: parseInt(viewsDownloads?.views || '0'),
    totalDownloads: parseInt(viewsDownloads?.downloads || '0'),
    totalPriority,
    fulfilledPriority,
  };
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export async function getDatasetTrend(months: number = 12): Promise<MonthlyTrend[]> {
  const rows = await queryReplika<{ month: string; count: string }>(
    `SELECT 
      TO_CHAR(cdate, 'YYYY-MM') as month,
      COUNT(*) as count
    FROM datasets 
    WHERE cdate >= NOW() - INTERVAL '${months} months'
      AND is_active = true AND is_deleted = false AND validate = 'approve'
    GROUP BY TO_CHAR(cdate, 'YYYY-MM')
    ORDER BY month ASC`
  );

  return rows.map((r) => ({
    month: r.month,
    count: parseInt(r.count),
  }));
}

export interface TopOrganisasi {
  id: number;
  name: string;
  count_dataset_all: number;
  count_dataset_public: number;
}

export async function getTopOrganisasi(limit: number = 5): Promise<TopOrganisasi[]> {
  return queryReplika<TopOrganisasi>(
    `SELECT id, name, count_dataset_all, count_dataset_public
    FROM organisasi 
    WHERE is_active = true AND is_deleted = false
    ORDER BY count_dataset_all DESC 
    LIMIT $1`,
    [limit]
  );
}

export interface RecentActivity {
  id: number;
  dataset_id: number;
  dataset_name: string;
  type: string;
  notes: string;
  username: string;
  cdate: string;
  organisasi_name: string;
}

export async function getRecentActivities(limit: number = 20): Promise<RecentActivity[]> {
  return queryReplika<RecentActivity>(
    `SELECT 
      h.id, h.dataset_id, d.name as dataset_name,
      h.type, h.notes, h.username,
      TO_CHAR(h.cdate AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI:SS+07:00') as cdate,
      o.name as organisasi_name
    FROM history_dataset h
    JOIN datasets d ON h.dataset_id = d.id
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    WHERE d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'
    ORDER BY h.cdate DESC
    LIMIT $1`,
    [limit]
  );
}

export interface PopularDataset {
  id: number;
  name: string;
  organisasi_name: string;
  total_views: number;
  total_downloads: number;
}

export async function getPopularDatasets(limit: number = 5): Promise<PopularDataset[]> {
  return queryReplika<PopularDataset>(
    `SELECT 
      d.id, d.name,
      o.name as organisasi_name,
      (d.count_view_opendata + d.count_view_satudata) as total_views,
      (d.count_download_opendata + d.count_download_satudata) as total_downloads
    FROM datasets d
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    WHERE d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'
    ORDER BY (d.count_view_opendata + d.count_view_satudata) DESC
    LIMIT $1`,
    [limit]
  );
}
