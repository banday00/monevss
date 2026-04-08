import { NextResponse } from 'next/server';
import { getBigdataColumns, getBigdataRows } from '@/lib/queries/bigdata';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ schema: string; table: string }> }
) {
  try {
    const { schema, table } = await params;
    const decodedSchema = decodeURIComponent(schema);
    const decodedTable  = decodeURIComponent(table);

    const { searchParams } = new URL(req.url);
    const page     = parseInt(searchParams.get('page')     ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50');
    const mode     = searchParams.get('mode'); // 'columns' | 'data'

    if (mode === 'columns') {
      const columns = await getBigdataColumns(decodedSchema, decodedTable);
      return NextResponse.json({ columns });
    }

    // default: data rows
    const { rows, total } = await getBigdataRows(decodedSchema, decodedTable, page, pageSize);
    return NextResponse.json({ rows, total, page, pageSize });
  } catch (error) {
    console.error('BigData data API error:', error);
    return NextResponse.json({ error: 'Gagal memuat data tabel' }, { status: 500 });
  }
}
