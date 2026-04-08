import { queryReplika } from '@/lib/db/replika';

export interface DiscontinueDataset {
  id: number;
  name: string;
  slug: string;
  organisasi_id: number;
  organisasi_name: string;
  validate_discontinue: string | null;
  timestamp_discontinue_submit: string | null;
  timestamp_discontinue_approved: string | null;
  is_active: boolean;
}

export interface DiscontinueHistory {
  id: number;
  dataset_id: number;
  dataset_name: string;
  dataset_slug: string;
  organisasi_name: string;
  type: string;
  notes: string | null;
  username: string | null;
  cdate: string;
}

export async function getDiscontinueDatasets(): Promise<DiscontinueDataset[]> {
  return queryReplika<DiscontinueDataset>(
    `SELECT 
      d.id, d.name, d.slug,
      d.organisasi_id, o.name as organisasi_name,
      d.validate_discontinue,
      d.timestamp_discontinue_submit,
      d.timestamp_discontinue_approved,
      d.is_active
    FROM datasets d
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    WHERE d.validate_discontinue IS NOT NULL
    ORDER BY d.timestamp_discontinue_submit DESC`
  );
}

export async function getDiscontinueHistory(limit: number = 100): Promise<DiscontinueHistory[]> {
  return queryReplika<DiscontinueHistory>(
    `SELECT 
      hd.id, hd.dataset_id,
      d.name as dataset_name,
      d.slug as dataset_slug,
      o.name as organisasi_name,
      hd.type, hd.notes, hd.username, hd.cdate
    FROM history_dataset_discontinue hd
    JOIN datasets d ON hd.dataset_id = d.id
    LEFT JOIN organisasi o ON d.organisasi_id = o.id
    ORDER BY hd.cdate DESC
    LIMIT $1`,
    [limit]
  );
}

export async function getDiscontinueStats(): Promise<{
  total: number;
  pending: number;
  approved: number;
  orgs: number;
}> {
  const rows = await queryReplika<{
    total: string;
    pending: string;
    approved: string;
    orgs: string;
  }>(
    `SELECT
      COUNT(*)                                                                      AS total,
      COUNT(CASE WHEN validate_discontinue = 'verification-new-active' THEN 1 END) AS pending,
      COUNT(CASE WHEN validate_discontinue = 'approve-active'          THEN 1 END) AS approved,
      COUNT(DISTINCT organisasi_id)                                                 AS orgs
    FROM datasets
    WHERE validate_discontinue IS NOT NULL`
  );
  const r = rows[0] ?? { total: '0', pending: '0', approved: '0', orgs: '0' };
  return {
    total:    parseInt(r.total),
    pending:  parseInt(r.pending),
    approved: parseInt(r.approved),
    orgs:     parseInt(r.orgs),
  };
}
