import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM tags ORDER BY name ASC');
      return NextResponse.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error: any) {
    // If table doesn't exist, return empty array (or 500 if strict)
    // We could lazily create table here too, but let's assume setup was run or we handle it gracefully
    if (error.code === '42P01') { // undefined_table
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const id = body.id || uuidv4();
      const { name, color, description } = body;
      
      // Check for duplicate name
      const existing = await client.query('SELECT id FROM tags WHERE LOWER(name) = LOWER($1)', [name]);
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'Tag with this name already exists' }, { status: 409 });
      }

      await client.query(
        'INSERT INTO tags (id, name, color, description, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [id, name, color || '#3b82f6', description]
      );

      await client.query('COMMIT');
      
      const newTag = {
        id,
        name,
        color: color || '#3b82f6',
        description,
        createdAt: new Date().toISOString()
      };
      
      return NextResponse.json(newTag, { status: 201 });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
