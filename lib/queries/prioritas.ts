import { queryReplika } from '@/lib/db/replika';

export interface PriorityItem {
  id: string | number;
  organization_id: string | number | null;
  organisasi_name: string | null;
  dataset_id: string | number | null;
  dataset_name: string | null;
  name: string;
  year: number;
  is_active: boolean;
  cdate: string;
  mdate: string;
}

export async function getPriorityData(year?: number): Promise<PriorityItem[]> {
  const targetYear = year || new Date().getFullYear() - 1;

  return queryReplika<PriorityItem>(
    `SELECT 
      dp.id, dp.organization_id, o.name as organisasi_name,
      CASE 
        WHEN d.id IS NOT NULL AND d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'
        THEN dp.dataset_id ELSE NULL 
      END as dataset_id,
      CASE 
        WHEN d.id IS NOT NULL AND d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'
        THEN d.name ELSE NULL 
      END as dataset_name,
      dp.name, dp.year, dp.is_active, dp.cdate, dp.mdate
    FROM data_priority dp
    LEFT JOIN organisasi o ON dp.organization_id = o.id
    LEFT JOIN datasets d ON dp.dataset_id = d.id
    WHERE dp.year = $1 AND dp.is_active = true AND dp.is_deleted = false
    ORDER BY o.name ASC, dp.name ASC`,
    [targetYear]
  );
}

export interface QualityScore {
  id: string;
  dataset_id: number;
  dataset_name: string;
  dataset_slug: string | null;
  organisasi_name: string;
  score: number;
  status: string | null;
  completeness: number | null;
  conformity: number | null;
  timeliness: number | null;
  uniqueness: number | null;
  consistency: number | null;
  timestamp: string;
}

export async function getQualityScores(limit: number = 200): Promise<QualityScore[]> {
  return queryReplika<QualityScore>(
    `SELECT 
      dqs.id, dqs.dataset_id, d.name as dataset_name,
      d.slug as dataset_slug,
      o.name as organisasi_name,
      dqs.score,
      dqs.status,
      CAST(dqs.details->'details'->'metrics'->'completeness'->>'score' AS INTEGER) AS completeness,
      CAST(dqs.details->'details'->'metrics'->'conformity'->>'score'   AS INTEGER) AS conformity,
      CAST(dqs.details->'details'->'metrics'->'timeliness'->>'score'   AS INTEGER) AS timeliness,
      CAST(dqs.details->'details'->'metrics'->'uniqueness'->>'score'   AS INTEGER) AS uniqueness,
      CAST(dqs.details->'details'->'metrics'->'consistency'->>'score'  AS INTEGER) AS consistency,
      dqs.timestamp
    FROM data_quality_score dqs
    JOIN datasets d ON dqs.dataset_id = d.id
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    WHERE d.is_active = true AND d.is_deleted = false AND d.validate = 'approve'
    ORDER BY dqs.score ASC
    LIMIT $1`,
    [limit]
  );
}

export interface OrganisasiDetail {
  id: number;
  name: string;
  slug: string;
  website: string | null;
  email: string | null;
  notelp: string | null;
  is_active: boolean;
  // real-time counts from datasets
  total_dataset: number;
  approved: number;
  pct_approved: number;
  avg_kualitas: number | null;
  last_update: string | null;
}

export async function getOrganisasiList(): Promise<OrganisasiDetail[]> {
  const rows = await queryReplika<{
    id: string;
    name: string;
    slug: string;
    website: string | null;
    email: string | null;
    notelp: string | null;
    is_active: boolean;
    total_dataset: string;
    approved: string;
    avg_kualitas: string | null;
    last_update: string | null;
  }>(
    `SELECT
      o.id::text, o.name, o.slug, o.website, o.email, o.notelp, o.is_active,
      COUNT(d.id)                                                             AS total_dataset,
      COUNT(CASE WHEN d.validate = 'approve' THEN 1 END)                     AS approved,
      ROUND(AVG(dqs.score)::numeric, 1)                                      AS avg_kualitas,
      MAX(d.mdate)                                                            AS last_update
    FROM organisasi o
    LEFT JOIN datasets d
      ON d.organisasi_id = o.id AND d.is_active = true AND d.is_deleted = false
    LEFT JOIN LATERAL (
      SELECT score FROM data_quality_score
      WHERE dataset_id = d.id ORDER BY timestamp DESC LIMIT 1
    ) dqs ON true
    WHERE o.is_deleted = false
    GROUP BY o.id, o.name, o.slug, o.website, o.email, o.notelp, o.is_active
    ORDER BY total_dataset DESC, o.name ASC`
  );

  return rows.map((r) => {
    const total    = parseInt(r.total_dataset);
    const approved = parseInt(r.approved);
    return {
      id:           parseInt(r.id),
      name:         r.name,
      slug:         r.slug,
      website:      r.website,
      email:        r.email,
      notelp:       r.notelp,
      is_active:    r.is_active,
      total_dataset: total,
      approved,
      pct_approved:  total > 0 ? Math.round((approved / total) * 100) : 0,
      avg_kualitas:  r.avg_kualitas != null ? parseFloat(String(r.avg_kualitas)) : null,
      last_update:   r.last_update,
    };
  });
}
