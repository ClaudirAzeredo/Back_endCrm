import { NextResponse } from "next/server"
import pool from "@/lib/db"

const allowedTypes = new Set(["text", "image", "video", "buttons"])

async function ensureTable() {
  const client = await pool.connect()
  try {
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS message_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(32) NOT NULL,
        content JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      `,
    )
  } finally {
    client.release()
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTable()
    const id = params.id
    const body = await request.json()
    const name = body?.name !== undefined ? String(body.name).trim() : undefined
    const type = body?.type !== undefined ? String(body.type) : undefined
    const content = body?.content

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "Nome do template é obrigatório" }, { status: 400 })
    }
    if (type !== undefined && !allowedTypes.has(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    const fields: string[] = []
    const values: any[] = []
    let idx = 1
    if (name !== undefined) {
      fields.push(`name = $${idx++}`)
      values.push(name)
    }
    if (type !== undefined) {
      fields.push(`type = $${idx++}`)
      values.push(type)
    }
    if (content !== undefined) {
      fields.push(`content = $${idx++}::jsonb`)
      values.push(JSON.stringify(content))
    }
    fields.push("updated_at = NOW()")
    values.push(id)

    const client = await pool.connect()
    try {
      const result = await client.query(
        `UPDATE message_templates SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        values,
      )

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
      }

      const r = result.rows[0]
      return NextResponse.json({
        id: r.id,
        name: r.name,
        type: r.type,
        content: r.content,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
      })
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await ensureTable()
    const id = params.id
    const client = await pool.connect()
    try {
      const result = await client.query("DELETE FROM message_templates WHERE id = $1 RETURNING id", [id])
      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Template não encontrado" }, { status: 404 })
      }
      return new NextResponse(null, { status: 204 })
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
