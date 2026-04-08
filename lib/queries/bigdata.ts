import { queryReplika } from '@/lib/db/replika';
import { queryBigdata } from '@/lib/db/bigdata';

export interface BigdataSchema {
  schema_name: string;
  org_name: string | null;
  table_count: number;
  dataset_count: number;
}

export interface BigdataTable {
  schema_name: string;
  table_name: string;
  dataset_id: number | null;
  dataset_name: string | null;
  dataset_slug: string | null;
  row_count: number | null;
  col_count: number | null;
}

export interface BigdataColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

// List all schemas & their table counts from pg_tables in bigdata
export async function getBigdataSchemas(): Promise<BigdataSchema[]> {
  const schemasRaw = await queryBigdata<{ schemaname: string; table_count: string }>(
    `SELECT schemaname, COUNT(*) as table_count
     FROM pg_tables
     WHERE schemaname NOT IN ('pg_catalog','information_schema','pg_toast','public','temporary')
     GROUP BY schemaname
     ORDER BY schemaname`
  );

  if (schemasRaw.length === 0) return [];

  const schemaNames = schemasRaw.map((r) => r.schemaname);

  // Get org display name + dataset count from replikasipdj
  const orgMap = await queryReplika<{ schema_name: string; org_name: string; dataset_count: string }>(
    `SELECT d.schema as schema_name, o.name as org_name, COUNT(DISTINCT d.id) as dataset_count
     FROM datasets d
     LEFT JOIN organisasi o ON d.organisasi_id = o.id
     WHERE d.schema = ANY($1::text[]) AND d.is_active = true AND d.is_deleted = false
     GROUP BY d.schema, o.name`,
    [schemaNames]
  );

  const orgBySchema = new Map(orgMap.map((r) => [r.schema_name, {
    org_name: r.org_name,
    dataset_count: parseInt(r.dataset_count),
  }]));

  return schemasRaw.map((r) => ({
    schema_name: r.schemaname,
    org_name: orgBySchema.get(r.schemaname)?.org_name ?? null,
    table_count: parseInt(r.table_count),
    dataset_count: orgBySchema.get(r.schemaname)?.dataset_count ?? 0,
  }));
}

// List tables in a schema with accurate row+col counts and dataset mapping
export async function getBigdataTables(schema: string): Promise<BigdataTable[]> {
  const tables = await queryBigdata<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`,
    [schema]
  );

  if (tables.length === 0) return [];

  // Accurate column counts from information_schema (now we have access)
  const colCounts = await queryBigdata<{ table_name: string; col_count: string }>(
    `SELECT table_name, COUNT(*) as col_count
     FROM information_schema.columns
     WHERE table_schema = $1
     GROUP BY table_name`,
    [schema]
  );
  const colCountMap = new Map(colCounts.map((r) => [r.table_name, parseInt(r.col_count)]));

  // Estimated row counts from pg_class reltuples (fast, no full COUNT(*))
  const rowCounts = await queryBigdata<{ relname: string; reltuples: string }>(
    `SELECT c.relname, c.reltuples::bigint as reltuples
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = $1 AND c.relkind = 'r'`,
    [schema]
  );
  const rowCountMap = new Map(rowCounts.map((r) => [
    r.relname,
    Math.max(0, Math.round(parseFloat(r.reltuples))),
  ]));

  // Dataset mapping from replikasipdj
  const tableNames = tables.map((t) => t.tablename);
  const datasets = await queryReplika<{ table_name: string; id: string; name: string; slug: string }>(
    `SELECT d.table as table_name, d.id::text, d.name, d.slug
     FROM datasets d
     WHERE d.schema = $1 AND d.table = ANY($2::text[])
     AND d.is_active = true AND d.is_deleted = false`,
    [schema, tableNames]
  );
  const datasetMap = new Map(datasets.map((d) => [d.table_name, d]));

  return tables.map((t) => {
    const ds = datasetMap.get(t.tablename);
    return {
      schema_name: schema,
      table_name: t.tablename,
      dataset_id: ds ? parseInt(ds.id) : null,
      dataset_name: ds?.name ?? null,
      dataset_slug: ds?.slug ?? null,
      row_count: rowCountMap.get(t.tablename) ?? null,
      col_count: colCountMap.get(t.tablename) ?? null,
    };
  });
}

// Get columns for a specific table
export async function getBigdataColumns(schema: string, table: string): Promise<BigdataColumn[]> {
  return queryBigdata<BigdataColumn>(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = $1 AND table_name = $2
     ORDER BY ordinal_position`,
    [schema, table]
  );
}

// Get paginated rows from a bigdata table
export async function getBigdataRows(
  schema: string,
  table: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const offset = (page - 1) * pageSize;

  // Strict validation to prevent SQL injection
  const safe = /^[a-z0-9_]+$/;
  if (!safe.test(schema) || !safe.test(table)) {
    throw new Error('Invalid schema or table name');
  }

  const [rows, countResult] = await Promise.all([
    queryBigdata<Record<string, unknown>>(
      `SELECT * FROM "${schema}"."${table}" LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    ),
    queryBigdata<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${schema}"."${table}"`
    ),
  ]);

  return {
    rows,
    total: parseInt(countResult[0]?.count ?? '0'),
  };
}
