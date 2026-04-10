import { getPriorityData } from '@/lib/queries/prioritas';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const year = request.nextUrl.searchParams.get('year')
      ? parseInt(request.nextUrl.searchParams.get('year')!)
      : undefined;

    const data = await getPriorityData(year);

    // Group by organisasi
    const grouped: Record<string, {
      organisasi_name: string;
      items: typeof data;
      total: number;
      fulfilled: number;
      percentage: number;
    }> = {};

    data.forEach((item) => {
      const key = String(item.organization_id);
      if (!grouped[key]) {
        grouped[key] = {
          organisasi_name: item.organisasi_name,
          items: [],
          total: 0,
          fulfilled: 0,
          percentage: 0,
        };
      }
      grouped[key].items.push(item);
      grouped[key].total++;
      if (item.dataset_id) grouped[key].fulfilled++;
    });

    Object.values(grouped).forEach((g) => {
      g.percentage = g.total > 0 ? Math.round((g.fulfilled / g.total) * 1000) / 10 : 0;
    });

    const totalAll = data.length;
    const fulfilledAll = data.filter((d) => d.dataset_id).length;

    const sortedAll = [...data].sort((a, b) => {
      const aHas = a.dataset_id ? 1 : 0;
      const bHas = b.dataset_id ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      if (a.organisasi_name !== b.organisasi_name) {
        return a.organisasi_name.localeCompare(b.organisasi_name);
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      all: sortedAll,
      grouped: Object.values(grouped).sort((a, b) => b.percentage - a.percentage),
      summary: {
        total: totalAll,
        fulfilled: fulfilledAll,
        unfulfilled: totalAll - fulfilledAll,
        percentage: totalAll > 0 ? Math.round((fulfilledAll / totalAll) * 1000) / 10 : 0,
      },
    });
  } catch (error) {
    console.error('Prioritas API Error:', error);
    return NextResponse.json({ error: 'Gagal memuat data prioritas' }, { status: 500 });
  }
}
