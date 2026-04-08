const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL_REPLIKA });

async function check() {
  const c = await pool.connect();
  try {
    // Cek apakah tabel data_quality_score ada
    const exists = await c.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'data_quality_score'"
    );
    console.log('data_quality_score exists:', exists.rows[0].count);

    if (parseInt(exists.rows[0].count) > 0) {
      const cols = await c.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data_quality_score' ORDER BY ordinal_position"
      );
      console.log('Columns:', JSON.stringify(cols.rows, null, 2));
      const sample = await c.query('SELECT * FROM data_quality_score LIMIT 3');
      console.log('Sample:', JSON.stringify(sample.rows, null, 2));
      const avg = await c.query('SELECT AVG(score) as avg FROM data_quality_score');
      console.log('Avg score raw:', avg.rows[0]);
    } else {
      console.log('Tabel data_quality_score TIDAK ADA');
    }

    // Cek data_score_status di datasets
    const scoreStatus = await c.query(
      "SELECT data_score_status, COUNT(*) FROM datasets WHERE is_active=true AND is_deleted=false AND validate='approve' GROUP BY data_score_status ORDER BY COUNT(*) DESC"
    );
    console.log('data_score_status distribution:', JSON.stringify(scoreStatus.rows, null, 2));
  } finally {
    c.release();
    await pool.end();
  }
}
check().catch(console.error);
