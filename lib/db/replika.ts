import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_REPLIKA_HOST,
  port: parseInt(process.env.DB_REPLIKA_PORT || '5432'),
  database: process.env.DB_REPLIKA_NAME,
  user: process.env.DB_REPLIKA_USER,
  password: process.env.DB_REPLIKA_PASSWORD,
  ssl: process.env.DB_REPLIKA_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function queryReplika<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryReplikaOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await queryReplika<T>(text, params);
  return rows[0] || null;
}

export default pool;
