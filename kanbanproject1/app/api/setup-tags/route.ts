import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create tags table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tags (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          color VARCHAR(50),
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await client.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Tags table created successfully' });
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
