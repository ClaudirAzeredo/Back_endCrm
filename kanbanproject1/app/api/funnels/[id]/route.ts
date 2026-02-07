import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await pool.connect();
    try {
      const { id } = params;
      const funnelResult = await client.query('SELECT * FROM funnels WHERE id = $1', [id]);
      
      if (funnelResult.rows.length === 0) {
        return NextResponse.json({ error: 'Funnel not found' }, { status: 404 });
      }

      const funnel = funnelResult.rows[0];
      const columnsResult = await client.query('SELECT * FROM funnel_columns WHERE funnel_id = $1 ORDER BY "order" ASC', [id]);
      
      funnel.columns = columnsResult.rows.map(col => ({
        ...col,
        isActive: col.visible
      }));

      return NextResponse.json(funnel);
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      // Update funnel fields
      const { name, description, category, icon, isActive } = body;
      if (name) {
        await client.query(
          'UPDATE funnels SET name = $1, description = $2, category = $3, icon = $4, is_active = $5 WHERE id = $6',
          [name, description, category, icon, isActive ?? true, id]
        );
      }

      // If columns are provided, we might need to update them. 
      // This simple implementation doesn't handle full column sync (add/remove/update) complex logic here
      // relying on specific updateColumns endpoint usually, but let's see.
      
      await client.query('COMMIT');
      
      return NextResponse.json({ success: true, id });
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const client = await pool.connect();
    
    try {
      await client.query('DELETE FROM funnels WHERE id = $1', [id]);
      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
