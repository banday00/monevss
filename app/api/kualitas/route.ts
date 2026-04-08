import { getQualityScores } from '@/lib/queries/prioritas';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scores = await getQualityScores(200);
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Kualitas API Error:', error);
    return NextResponse.json({ error: 'Gagal memuat data kualitas' }, { status: 500 });
  }
}
