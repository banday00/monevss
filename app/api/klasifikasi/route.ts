import { NextRequest, NextResponse } from 'next/server';
import {
  getKlasifikasiSummary,
  getDatasetsByKlasifikasi,
  getKlasifikasiTopikBreakdown,
} from '@/lib/queries/klasifikasi';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const klasifikasi = searchParams.get('klasifikasi') || undefined;

    const [summary, datasets, topikBreakdown] = await Promise.all([
      getKlasifikasiSummary(),
      getDatasetsByKlasifikasi(klasifikasi),
      getKlasifikasiTopikBreakdown(),
    ]);

    return NextResponse.json({ summary, datasets, topikBreakdown });
  } catch (error) {
    console.error('Klasifikasi API error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data klasifikasi' },
      { status: 500 }
    );
  }
}
