import { getPengumpulanData, getPengumpulanYearly, getUnlinkedStats } from '@/lib/queries/pengumpulan';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : undefined;

    const [perOrganisasi, yearly, unlinked] = await Promise.all([
      getPengumpulanData(year),
      getPengumpulanYearly(5),
      getUnlinkedStats(year),
    ]);

    // Calculate overall summary
    const totalPriority = perOrganisasi.reduce((s, o) => s + o.total_priority, 0);
    const totalFulfilled = perOrganisasi.reduce((s, o) => s + o.fulfilled, 0);
    const overallPercentage = totalPriority > 0
      ? Math.round((totalFulfilled / totalPriority) * 1000) / 10
      : 0;

    return NextResponse.json({
      perOrganisasi,
      yearly,
      unlinked,
      summary: {
        totalOrgs: perOrganisasi.length,
        totalPriority,
        totalFulfilled,
        totalUnfulfilled: totalPriority - totalFulfilled,
        overallPercentage,
        selectedYear: year || new Date().getFullYear(),
      },
    });
  } catch (error) {
    console.error('Pengumpulan API Error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data pengumpulan' },
      { status: 500 }
    );
  }
}
