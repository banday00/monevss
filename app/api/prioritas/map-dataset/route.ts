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
      // ── Pre-check: apakah dataset ini sudah di-mapping ke priority lain? ──
      const conflicts = await queryReplika<{
        id: string;
        name: string;
        year: number;
      }>(
        `SELECT dp.id, dp.name, dp.year
         FROM data_priority dp
         WHERE dp.dataset_id = $1
           AND dp.id != $2
           AND dp.is_active  = true
           AND dp.is_deleted = false`,
        [parsedDatasetId, priority_id]
      );

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        return NextResponse.json(
          {
            error: `Dataset ini sudah di-mapping ke "${conflict.name}" (Tahun ${conflict.year}). Lepas mapping tersebut terlebih dahulu sebelum memetakan ke prioritas ini.`,
            conflict: { id: conflict.id, name: conflict.name, year: conflict.year },
          },
          { status: 409 }
        );
      }

      // Map: isi dataset_id dan tandai status_priority = true
      await queryReplika(
        `UPDATE data_priority
         SET dataset_id      = $1,
             status_priority = true,
             mdate           = NOW()
         WHERE id = $2`,
        [parsedDatasetId, priority_id]
      );

      // Update priority_level di tabel datasets
      await queryReplika(
        `UPDATE datasets
         SET priority_level = 'priority'
         WHERE id = $1`,
        [parsedDatasetId]
      );
    } else {
      // Ambil dataset_id lama sebelum di-unmap
      const rows = await queryReplika<{ dataset_id: number | null }>(
        `SELECT dataset_id FROM data_priority WHERE id = $1`,
        [priority_id]
      );
      const oldDatasetId = rows[0]?.dataset_id ?? null;

      // Unmap: kosongkan dataset_id dan reset status_priority = false
      await queryReplika(
        `UPDATE data_priority
         SET dataset_id      = NULL,
             status_priority = false,
             mdate           = NOW()
         WHERE id = $1`,
        [priority_id]
      );

      // Reset priority_level di datasets hanya jika tidak ada mapping lain
      if (oldDatasetId != null) {
        const stillMapped = await queryReplika<{ count: string }>(
          `SELECT COUNT(*) as count
           FROM data_priority
           WHERE dataset_id = $1
             AND is_active  = true
             AND is_deleted = false`,
          [oldDatasetId]
        );
        if (parseInt(stillMapped[0]?.count ?? '0', 10) === 0) {
          await queryReplika(
            `UPDATE datasets
             SET priority_level = 'non-priority'
             WHERE id = $1`,
            [oldDatasetId]
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Map Dataset API Error:', message);
    return NextResponse.json(
      { error: 'Gagal menyimpan mapping dataset', detail: message },
      { status: 500 }
    );
  }
}
