import { NextResponse } from 'next/server';
import {
  getDiscontinueDatasets,
  getDiscontinueHistory,
  getDiscontinueStats,
} from '@/lib/queries/diskontinuasi';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode'); // 'history' | 'stats' | default=datasets

    if (mode === 'history') {
      const history = await getDiscontinueHistory(100);
      return NextResponse.json({ history });
    }

    if (mode === 'stats') {
      const stats = await getDiscontinueStats();
      return NextResponse.json({ stats });
    }

    // default: datasets + history + stats in one shot
    const [datasets, history, stats] = await Promise.all([
      getDiscontinueDatasets(),
      getDiscontinueHistory(50),
      getDiscontinueStats(),
    ]);

    return NextResponse.json({ datasets, history, stats });
  } catch (error) {
    console.error('Diskontinuasi API Error:', error);
    return NextResponse.json({ error: 'Gagal memuat data diskontinuasi' }, { status: 500 });
  }
}
