import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.PG_URI,
  ssl: {
    rejectUnauthorized: false, // Cho phép kết nối với chứng chỉ của Neon
  },
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err, client) => {
  console.error('Lỗi Postgres:', err);
});

export default pool;