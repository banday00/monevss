import { getOrganisasiList } from '@/lib/queries/prioritas';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getOrganisasiList();
    return NextResponse.json({ organisasi: data });
  } catch (error) {
    console.error('Organisasi API Error:', error);
    return NextResponse.json({ error: 'Gagal memuat data organisasi' }, { status: 500 });
  }
}
