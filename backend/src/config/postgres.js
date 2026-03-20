import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.PG_URI,
  // Thêm phần này vào
  ssl: {
    rejectUnauthorized: false, // Cho phép kết nối với chứng chỉ của Neon
  },
});

pool.on('error', (err, client) => {
  console.error('Lỗi Postgres:', err);
});

export default pool;