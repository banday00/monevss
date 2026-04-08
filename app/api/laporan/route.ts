import { NextResponse } from 'next/server';
import {
  getReportSummary,
  getMonthlyReport,
  getYearlyReport,
  getOrgReport,
} from '@/lib/queries/laporan';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode   = searchParams.get('mode');   // 'org' | 'monthly' | 'yearly'
    const months = parseInt(searchParams.get('months') ?? '12');

    if (mode === 'org') {
      const orgs = await getOrgReport();
      return NextResponse.json({ orgs });
    }

    // default: all data at once
    const [summary, monthly, yearly, orgs] = await Promise.all([
      getReportSummary(),
      getMonthlyReport(months),
      getYearlyReport(),
      getOrgReport(),
    ]);

    return NextResponse.json({ summary, monthly, yearly, orgs });
  } catch (error) {
    console.error('Laporan API error:', error);
    return NextResponse.json({ error: 'Gagal memuat data laporan' }, { status: 500 });
  }
}
