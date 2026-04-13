import { queryReplika } from '@/lib/db/replika';

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

/**
 * Mengambil data kualitas dataset dari tabel data_quality_score.
 * Menampilkan seluruh dataset yang aktif dan disetujui tanpa batasan limit.
 */
export async function getQualityScores(): Promise<QualityScore[]> {
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
    ORDER BY dqs.score desc`
  );
}
