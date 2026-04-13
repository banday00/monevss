import { getQualityScores } from '@/lib/queries/kualitas';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scores = await getQualityScores();
    return NextResponse.json({ scores });
  } catch (error) {
    console.error('Kualitas API Error:', error);
    return NextResponse.json({ error: 'Gagal memuat data kualitas' }, { status: 500 });
  }
}
