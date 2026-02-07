import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: funnelId } = params;
    const body = await request.json();
    const { columns } = body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      
      // Delete existing columns
      await client.query('DELETE FROM funnel_columns WHERE funnel_id = $1', [funnelId]);

      // Insert new columns
      if (columns && Array.isArray(columns)) {
        for (const col of columns) {
          const colId = col.id || uuidv4();
          await client.query(
            'INSERT INTO funnel_columns (id, funnel_id, name, color, "order", description, visible, "limit") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [colId, funnelId, col.name, col.color, col.order, col.description, col.visible ?? true, col.limit]
          );
        }
      }

      await client.query('COMMIT');
      
      // Fetch updated funnel to return
      const funnelResult = await client.query('SELECT * FROM funnels WHERE id = $1', [funnelId]);
      const funnel = funnelResult.rows[0];
      
      const columnsResult = await client.query('SELECT * FROM funnel_columns WHERE funnel_id = $1 ORDER BY "order" ASC', [funnelId]);
      funnel.columns = columnsResult.rows.map(col => ({
        ...col,
        isActive: col.visible
      }));
      
      return NextResponse.json(funnel);
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
