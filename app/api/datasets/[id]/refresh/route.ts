import { queryReplika } from '@/lib/db/replika';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RefreshResult {
  qs_score: number | null;
  qs_status: string | null;
  qs_completeness: number | null;
  qs_conformity: number | null;
  qs_timeliness: number | null;
  qs_uniqueness: number | null;
  qs_consistency: number | null;
  priority_years: number[] | null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const datasetId = parseInt(id, 10);
  if (isNaN(datasetId)) {
    return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 });
  }

  try {
    const rows = await queryReplika<{
      qs_score: string | null;
      qs_status: string | null;
      qs_completeness: string | null;
      qs_conformity: string | null;
      qs_timeliness: string | null;
      qs_uniqueness: string | null;
      qs_consistency: string | null;
      priority_years: number[] | null;
    }>(
      `SELECT
         dqs.score                                                          AS qs_score,
         dqs.status                                                         AS qs_status,
         CAST(dqs.details->'details'->'metrics'->'completeness'->>'score'  AS INTEGER) AS qs_completeness,
         CAST(dqs.details->'details'->'metrics'->'conformity'->>'score'    AS INTEGER) AS qs_conformity,
         CAST(dqs.details->'details'->'metrics'->'timeliness'->>'score'    AS INTEGER) AS qs_timeliness,
         CAST(dqs.details->'details'->'metrics'->'uniqueness'->>'score'    AS INTEGER) AS qs_uniqueness,
         CAST(dqs.details->'details'->'metrics'->'consistency'->>'score'   AS INTEGER) AS qs_consistency,
         dp_years.years AS priority_years
       FROM datasets d
       LEFT JOIN LATERAL (
         SELECT score, status, details
         FROM data_quality_score
         WHERE dataset_id = d.id
         ORDER BY timestamp DESC
         LIMIT 1
       ) dqs ON true
       LEFT JOIN LATERAL (
         SELECT array_agg(DISTINCT dp.year ORDER BY dp.year) AS years
         FROM data_priority dp
         WHERE dp.dataset_id = d.id
           AND dp.is_active = true
           AND dp.is_deleted = false
       ) dp_years ON true
       WHERE d.id = $1`,
      [datasetId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: 'Dataset tidak ditemukan' }, { status: 404 });
    }

    const r = rows[0];
    const result: RefreshResult = {
      qs_score:       r.qs_score       != null ? parseInt(r.qs_score as string)       : null,
      qs_status:      r.qs_status,
      qs_completeness: r.qs_completeness != null ? parseInt(r.qs_completeness as string) : null,
      qs_conformity:  r.qs_conformity   != null ? parseInt(r.qs_conformity as string)  : null,
      qs_timeliness:  r.qs_timeliness   != null ? parseInt(r.qs_timeliness as string)  : null,
      qs_uniqueness:  r.qs_uniqueness   != null ? parseInt(r.qs_uniqueness as string)  : null,
      qs_consistency: r.qs_consistency  != null ? parseInt(r.qs_consistency as string) : null,
      priority_years: r.priority_years,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[dataset-refresh]', error);
    return NextResponse.json({ error: 'Gagal refresh data' }, { status: 500 });
  }
}
