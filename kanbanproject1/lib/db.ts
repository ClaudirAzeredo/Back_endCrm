import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',
  password: 'car1804',
  host: 'localhost',
  port: 5432,
  database: 'crmUni',
});

export default pool;
