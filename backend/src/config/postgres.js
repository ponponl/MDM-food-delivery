const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.PG_URI,
});
export default pool;