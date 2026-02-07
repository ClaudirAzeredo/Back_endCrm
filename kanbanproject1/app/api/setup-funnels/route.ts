import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create funnels table
      await client.query(`
        CREATE TABLE IF NOT EXISTS funnels (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          category VARCHAR(255),
          icon VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          company_id VARCHAR(255)
        );
      `);

      // Create funnel_columns table
      await client.query(`
        CREATE TABLE IF NOT EXISTS funnel_columns (
          id VARCHAR(255) PRIMARY KEY,
          funnel_id VARCHAR(255) REFERENCES funnels(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          color VARCHAR(50),
          "order" INTEGER,
          description TEXT,
          visible BOOLEAN DEFAULT TRUE,
          "limit" INTEGER
        );
      `);

      await client.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Tables created successfully' });
    } catch (e: any) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
