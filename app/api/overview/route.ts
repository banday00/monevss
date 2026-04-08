import {
  getOverviewStats,
  getDatasetTrend,
  getTopOrganisasi,
  getRecentActivities,
  getPopularDatasets,
} from '@/lib/queries/overview';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [stats, trend, topOrgs, activities, popular] = await Promise.all([
      getOverviewStats(),
      getDatasetTrend(12),
      getTopOrganisasi(5),
      getRecentActivities(20),
      getPopularDatasets(5),
    ]);

    return NextResponse.json({
      stats,
      trend,
      topOrganisasi: topOrgs,
      recentActivities: activities,
      popularDatasets: popular,
    });
  } catch (error) {
    console.error('Overview API Error:', error);
    return NextResponse.json(
      { error: 'Gagal memuat data overview' },
      { status: 500 }
    );
  }
}
