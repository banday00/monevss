import { queryReplika } from '@/lib/db/replika';
import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Coba update priority_level di tabel datasets.
 *  Jika user tidak punya hak UPDATE ke tabel ini, error diabaikan (log saja). */
async function tryUpdatePriorityLevel(datasetId: number, level: 'priority' | 'non-priority') {
  try {
    await queryReplika(
      `UPDATE datasets SET priority_level = $1 WHERE id = $2`,
      [level, datasetId]
    );
  } catch (err) {
    // dashboard_reader mungkin tidak punya hak UPDATE ke tabel datasets — abaikan
    console.warn(
      `[map-dataset] Tidak dapat update priority_level datasets id=${datasetId}:`,
      err instanceof Error ? err.message : err
    );
  }
}

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
      // ── Operasi utama: mapping ──────────────────────────────────────────
      await queryReplika(
        `UPDATE data_priority
         SET dataset_id      = $1,
             status_priority = true,
             mdate           = NOW()
         WHERE id = $2`,
        [parsedDatasetId, priority_id]
      );

      // Opsional: update flag priority_level di datasets (bisa gagal jika read-only)
      await tryUpdatePriorityLevel(parsedDatasetId, 'priority');

    } else {
      // ── Operasi utama: unmap ────────────────────────────────────────────
      const rows = await queryReplika<{ dataset_id: number | null }>(
        `SELECT dataset_id FROM data_priority WHERE id = $1`,
        [priority_id]
      );
      const oldDatasetId = rows[0]?.dataset_id ?? null;

      await queryReplika(
        `UPDATE data_priority
         SET dataset_id      = NULL,
             status_priority = false,
             mdate           = NOW()
         WHERE id = $1`,
        [priority_id]
      );

      // Reset priority_level hanya jika tidak ada mapping lain ke dataset yang sama
      if (oldDatasetId != null) {
        const stillMapped = await queryReplika<{ count: string }>(
          `SELECT COUNT(*) AS count
           FROM data_priority
           WHERE dataset_id = $1
             AND is_active  = true
             AND is_deleted = false`,
          [oldDatasetId]
        );
        if (parseInt(stillMapped[0]?.count ?? '0', 10) === 0) {
          await tryUpdatePriorityLevel(oldDatasetId, 'non-priority');
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
