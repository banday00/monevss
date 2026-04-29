import { queryReplika } from '@/lib/db/replika';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface DatasetSearchResult {
  id: number;
  name: string;
  slug: string;
  organisasi_name: string;
  topik_name: string;
  dimensi_awal: string | null;
  dimensi_akhir: string | null;
  similarity: number;
}

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await queryReplika<DatasetSearchResult>(
      `SELECT
         d.id, d.name, d.slug, o.name AS organisasi_name, t.name AS topik_name,
         MAX(CASE WHEN dm.key = 'Dimensi Dataset Awal'  THEN dm.value END) AS dimensi_awal,
         MAX(CASE WHEN dm.key = 'Dimensi Dataset Akhir' THEN dm.value END) AS dimensi_akhir,
         word_similarity($2, d.name) AS similarity
       FROM datasets d
       LEFT JOIN organisasi o ON d.organisasi_id = o.id
       LEFT JOIN topik t ON d.topik_id = t.id
       LEFT JOIN datasets_metadata dm ON dm.dataset_id = d.id
       WHERE d.is_active = true
         AND d.is_deleted = false
         AND d.validate IN ('approve', 'change')
         AND (
           d.name ILIKE $1
           OR word_similarity($2, d.name) > 0.15
         )
       GROUP BY d.id, d.name, d.slug, o.name, t.name
       ORDER BY similarity DESC, d.name ASC
       LIMIT 5`,
      [`%${q}%`, q]
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search Dataset API Error:', error);
    return NextResponse.json({ error: 'Gagal mencari dataset' }, { status: 500 });
  }
}
