import { queryReplika } from '@/lib/db/replika';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { priority_id, dataset_id } = body as {
      priority_id: string;
      dataset_id: number | string | null;
    };

    if (!priority_id || typeof priority_id !== 'string' || priority_id.trim() === '') {
      return NextResponse.json({ error: 'priority_id tidak valid' }, { status: 400 });
    }

    const parsedDatasetId = dataset_id != null ? parseInt(String(dataset_id), 10) : null;

    // Update mapping + status_priority sekaligus di data_priority
    await queryReplika(
      `UPDATE data_priority
       SET dataset_id       = $1,
           status_priority  = ($1 IS NOT NULL),
           mdate            = NOW()
       WHERE id = $2`,
      [parsedDatasetId ?? null, priority_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Map Dataset API Error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan mapping dataset' }, { status: 500 });
  }
}
