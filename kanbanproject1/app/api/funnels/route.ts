import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const client = await pool.connect();
    try {
      const funnelsResult = await client.query('SELECT * FROM funnels ORDER BY created_at DESC');
      let funnels = funnelsResult.rows;

      if (funnels.length === 0) {
        // Create a default funnel
        const defaultFunnelId = uuidv4();
        await client.query('BEGIN');
        await client.query(
          'INSERT INTO funnels (id, name, description, category, icon, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          [defaultFunnelId, 'Funil de Vendas Padrão', 'Funil padrão do sistema', 'sales', 'Target', true]
        );

        const defaultColumns = [
          { name: 'Novo Lead', color: '#3b82f6', order: 0 },
          { name: 'Contato Feito', color: '#eab308', order: 1 },
          { name: 'Proposta Enviada', color: '#a855f7', order: 2 },
          { name: 'Negociação', color: '#f97316', order: 3 },
          { name: 'Fechado', color: '#22c55e', order: 4 }
        ];

        for (const col of defaultColumns) {
          await client.query(
            'INSERT INTO funnel_columns (id, funnel_id, name, color, "order", visible, "limit") VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [uuidv4(), defaultFunnelId, col.name, col.color, col.order, true, null]
          );
        }
        await client.query('COMMIT');
        
        // Re-fetch
        const newResult = await client.query('SELECT * FROM funnels WHERE id = $1', [defaultFunnelId]);
        funnels = newResult.rows;
      }

      for (const funnel of funnels) {
        const columnsResult = await client.query('SELECT * FROM funnel_columns WHERE funnel_id = $1 ORDER BY "order" ASC', [funnel.id]);
        funnel.columns = columnsResult.rows.map(col => ({
          ...col,
          isActive: col.visible // Map visible to isActive/visible as needed
        }));
      }

      return NextResponse.json(funnels);
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const funnelId = uuidv4();
      const { name, description, category, icon, isActive, columns } = body;
      
      await client.query(
        'INSERT INTO funnels (id, name, description, category, icon, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [funnelId, name, description, category, icon, isActive ?? true]
      );

      if (columns && Array.isArray(columns)) {
        for (const col of columns) {
          const colId = uuidv4();
          await client.query(
            'INSERT INTO funnel_columns (id, funnel_id, name, color, "order", description, visible, "limit") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [colId, funnelId, col.name, col.color, col.order, col.description, col.visible ?? true, col.limit]
          );
        }
      }

      await client.query('COMMIT');
      
      // Fetch the created funnel to return it
      const createdFunnel = {
        id: funnelId,
        ...body,
        createdAt: new Date().toISOString()
      };
      
      return NextResponse.json(createdFunnel, { status: 201 });
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
