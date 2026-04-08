import { NextResponse } from 'next/server';
import { getBigdataSchemas } from '@/lib/queries/bigdata';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const schemas = await getBigdataSchemas();
    return NextResponse.json({ schemas });
  } catch (error) {
    console.error('BigData schemas API error:', error);
    return NextResponse.json({ error: 'Gagal memuat daftar schema' }, { status: 500 });
  }
}
