import { NextResponse } from 'next/server';
import { getBigdataTables } from '@/lib/queries/bigdata';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schema: string }> }
) {
  try {
    const { schema } = await params;
    const decodedSchema = decodeURIComponent(schema);
    const tables = await getBigdataTables(decodedSchema);
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('BigData tables API error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar tabel' }, { status: 500 });
  }
}
