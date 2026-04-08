import { getDatasets, getDatasetHistory, getOrganisasiOptions, getTopikOptions } from '@/lib/queries/datasets';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // If requesting history for a specific dataset
    const historyFor = searchParams.get('history_for');
    if (historyFor) {
      const history = await getDatasetHistory(parseInt(historyFor));
      return NextResponse.json({ history });
    }

    const filters = {
      organisasi_id: searchParams.get('organisasi_id') || undefined,
      topik_id: searchParams.get('topik_id') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      tab: (searchParams.get('tab') as 'new' | 'updated' | 'all') || 'all',
      search: searchParams.get('search') || undefined,
    };

    const [datasets, organisasiOptions, topikOptions] = await Promise.all([
      getDatasets(filters),
      getOrganisasiOptions(),
      getTopikOptions(),
    ]);

    return NextResponse.json({
      datasets,
      organisasiOptions,
      topikOptions,
    });
  } catch (error) {
    console.error('Datasets API Error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data dataset' },
      { status: 500 }
    );
  }
}
