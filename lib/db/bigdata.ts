import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_BIGDATA_HOST,
  port: parseInt(process.env.DB_BIGDATA_PORT || '5432'),
  database: process.env.DB_BIGDATA_NAME,
  user: process.env.DB_BIGDATA_USER,
  password: process.env.DB_BIGDATA_PASSWORD,
  ssl: process.env.DB_BIGDATA_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export async function queryBigdata<T = Record<string, unknown>>(
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

export default pool;
