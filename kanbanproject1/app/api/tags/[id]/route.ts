import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const client = await pool.connect();

    try {
      const { name, color, description } = body;
      
      await client.query(
        'UPDATE tags SET name = $1, color = $2, description = $3 WHERE id = $4',
        [name, color, description, id]
      );
      
      return NextResponse.json({ id, name, color, description });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await pool.connect();
    
    try {
      await client.query('DELETE FROM tags WHERE id = $1', [id]);
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
