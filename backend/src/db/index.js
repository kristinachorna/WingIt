import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// A pool reuses connections instead of opening a new one per query —
// this is the standard pattern for a Node + Postgres backend.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = (text, params) => pool.query(text, params);
