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
    const isMapping = parsedDatasetId != null && !isNaN(parsedDatasetId);

    if (isMapping) {
      // Map: isi dataset_id dan tandai status_priority = true
      await queryReplika(
        `UPDATE data_priority
         SET dataset_id      = $1,
             status_priority = true,
             mdate           = NOW()
         WHERE id = $2`,
        [parsedDatasetId, priority_id]
      );
    } else {
      // Unmap: kosongkan dataset_id dan reset status_priority = false
      await queryReplika(
        `UPDATE data_priority
         SET dataset_id      = NULL,
             status_priority = false,
             mdate           = NOW()
         WHERE id = $1`,
        [priority_id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Map Dataset API Error:', error);
    return NextResponse.json({ error: 'Gagal menyimpan mapping dataset' }, { status: 500 });
  }
}
