import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

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

export async function GET() {
  try {
    await ensureTable()
    const client = await pool.connect()
    try {
      const result = await client.query("SELECT * FROM message_templates ORDER BY updated_at DESC")
      const rows = result.rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type,
        content: r.content,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
      }))
      return NextResponse.json(rows)
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureTable()
    const body = await request.json()
    const name = String(body?.name || "").trim()
    const type = String(body?.type || "")
    const content = body?.content ?? {}

    if (!name) {
      return NextResponse.json({ error: "Nome do template é obrigatório" }, { status: 400 })
    }
    if (!allowedTypes.has(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    const id = uuidv4()
    const client = await pool.connect()
    try {
      const result = await client.query(
        "INSERT INTO message_templates (id, name, type, content, created_at, updated_at) VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW()) RETURNING *",
        [id, name, type, JSON.stringify(content)],
      )
      const r = result.rows[0]
      return NextResponse.json(
        {
          id: r.id,
          name: r.name,
          type: r.type,
          content: r.content,
          createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
          updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
        },
        { status: 201 },
      )
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

