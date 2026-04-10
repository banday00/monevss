import { queryReplika } from '@/lib/db/replika';

export interface DatasetRow {
  id: number;
  name: string;
  slug: string;
  organisasi_id: number;
  organisasi_name: string;
  topik_id: number;
  topik_name: string;
  periode: string;
  kategori: string;
  klasifikasi: string;
  is_active: boolean;
  is_deleted: boolean;
  validate: string | null;
  priority_level: string | null;
  data_score_status: string | null;
  count_view_opendata: number;
  count_download_opendata: number;
  cdate: string;
  mdate: string;
  cuid: number;
  muid: number;
  // Quality score dari data_quality_score
  qs_score: number | null;
  qs_status: string | null;
  qs_completeness: number | null;
  qs_conformity: number | null;
  qs_timeliness: number | null;
  qs_uniqueness: number | null;
  qs_consistency: number | null;
}

export interface DatasetFilters {
  organisasi_id?: string;
  topik_id?: string;
  start_date?: string;
  end_date?: string;
  tab?: 'new' | 'updated' | 'all';
  search?: string;
}

export async function getDatasets(filters: DatasetFilters = {}): Promise<DatasetRow[]> {
  const conditions: string[] = ['d.is_deleted = false'];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.organisasi_id) {
    conditions.push(`d.organisasi_id = $${paramIndex++}`);
    params.push(parseInt(filters.organisasi_id));
  }

  if (filters.topik_id) {
    conditions.push(`d.topik_id = $${paramIndex++}`);
    params.push(parseInt(filters.topik_id));
  }

  if (filters.start_date && filters.tab !== 'all') {
    if (filters.tab === 'updated') {
      conditions.push(`d.mdate >= $${paramIndex++}`);
    } else {
      conditions.push(`d.cdate >= $${paramIndex++}`);
    }
    params.push(filters.start_date);
  }

  if (filters.end_date && filters.tab !== 'all') {
    if (filters.tab === 'updated') {
      conditions.push(`d.mdate <= $${paramIndex++}`);
    } else {
      conditions.push(`d.cdate <= $${paramIndex++}`);
    }
    params.push(filters.end_date + 'T23:59:59');
  }

  if (filters.tab === 'new') {
    // Tab "Baru": is_active=true, validate IN ('verification','new')
    conditions.push(`d.is_active = true`);
    conditions.push(`d.validate IN ('verification', 'new')`);
    if (!filters.start_date) {
      conditions.push(`d.cdate >= NOW() - INTERVAL '30 days'`);
    }
  } else if (filters.tab === 'updated') {
    // Tab "Diupdate": is_active=true, validate IN ('change','edit')
    conditions.push(`d.is_active = true`);
    conditions.push(`d.validate IN ('change', 'edit')`);
    if (!filters.start_date) {
      conditions.push(`d.mdate >= NOW() - INTERVAL '30 days'`);
    }
  } else {
    // Tab "Semua": is_active=true, validate='approve'
    conditions.push(`d.is_active = true`);
    conditions.push(`d.validate = 'approve'`);
  }

  if (filters.search) {
    conditions.push(`(d.name ILIKE $${paramIndex++} OR o.name ILIKE $${paramIndex++})`);
    params.push(`%${filters.search}%`);
    params.push(`%${filters.search}%`);
  }

  const orderBy = filters.tab === 'updated' ? 'd.mdate DESC' : 'd.cdate DESC';

  const sql = `
    SELECT 
      d.id, d.name, d.slug, d.organisasi_id, o.name as organisasi_name,
      d.topik_id, t.name as topik_name, d.periode, d.kategori, d.klasifikasi,
      d.is_active, d.is_deleted, d.validate, d.priority_level, d.data_score_status,
      d.count_view_opendata, d.count_download_opendata,
      d.cdate, d.mdate, d.cuid, d.muid,
      -- Quality score dimensions
      dqs.score                                                          AS qs_score,
      dqs.status                                                         AS qs_status,
      CAST(dqs.details->'details'->'metrics'->'completeness'->>'score'  AS INTEGER) AS qs_completeness,
      CAST(dqs.details->'details'->'metrics'->'conformity'->>'score'    AS INTEGER) AS qs_conformity,
      CAST(dqs.details->'details'->'metrics'->'timeliness'->>'score'    AS INTEGER) AS qs_timeliness,
      CAST(dqs.details->'details'->'metrics'->'uniqueness'->>'score'    AS INTEGER) AS qs_uniqueness,
      CAST(dqs.details->'details'->'metrics'->'consistency'->>'score'   AS INTEGER) AS qs_consistency
    FROM datasets d
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    LEFT JOIN topik t ON d.topik_id = t.id
    LEFT JOIN LATERAL (
      SELECT score, status, details
      FROM data_quality_score
      WHERE dataset_id = d.id
      ORDER BY timestamp DESC
      LIMIT 1
    ) dqs ON true
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${orderBy}
    LIMIT 500
  `;

  return queryReplika<DatasetRow>(sql, params);
}

export interface DatasetHistory {
  id: number;
  dataset_id: number;
  type: string;
  notes: string;
  username: string;
  cdate: string;
}

export async function getDatasetHistory(datasetId: number): Promise<DatasetHistory[]> {
  return queryReplika<DatasetHistory>(
    `SELECT id, dataset_id, type, notes, username, cdate
     FROM history_dataset
     WHERE dataset_id = $1
     ORDER BY cdate DESC
     LIMIT 100`,
    [datasetId]
  );
}

export interface OrgOption {
  id: number;
  name: string;
}

export async function getOrganisasiOptions(): Promise<OrgOption[]> {
  return queryReplika<OrgOption>(
    `SELECT id, name FROM organisasi WHERE is_active = true AND is_deleted = false ORDER BY name`
  );
}

export interface TopikOption {
  id: number;
  name: string;
}

export async function getTopikOptions(): Promise<TopikOption[]> {
  return queryReplika<TopikOption>(
    `SELECT id, name FROM topik WHERE is_active = true AND is_deleted = false ORDER BY name`
  );
}
