import { NextResponse } from "next/server"
import pool from "@/lib/db"

type JobStatus = "queued" | "running" | "completed" | "failed"

async function ensureTables() {
  const client = await pool.connect()
  try {
    await client.query(
      `
      CREATE TABLE IF NOT EXISTS mass_action_jobs (
        id VARCHAR(255) PRIMARY KEY,
        idempotency_key VARCHAR(255) UNIQUE,
        created_by JSONB NOT NULL DEFAULT '{}'::jsonb,
        template_id VARCHAR(255) NOT NULL,
        template_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
        filter_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        throttling JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(32) NOT NULL,
        total_leads INTEGER NOT NULL DEFAULT 0,
        total_items INTEGER NOT NULL DEFAULT 0,
        sent_items INTEGER NOT NULL DEFAULT 0,
        failed_items INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      `,
    )
  } finally {
    client.release()
  }
}

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables()
    const { id } = await ctx.params
    const jobId = String(id || "").trim()
    if (!jobId) return NextResponse.json({ error: "id inválido" }, { status: 400 })

    const client = await pool.connect()
    try {
      const result = await client.query("SELECT * FROM mass_action_jobs WHERE id = $1", [jobId])
      const r = result.rows?.[0]
      if (!r) return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
      return NextResponse.json({
        id: r.id,
        idempotencyKey: r.idempotency_key || null,
        createdBy: r.created_by,
        templateId: r.template_id,
        templateSnapshot: r.template_snapshot,
        filterPayload: r.filter_payload,
        throttling: r.throttling,
        status: r.status as JobStatus,
        totalLeads: r.total_leads,
        totalItems: r.total_items,
        sentItems: r.sent_items,
        failedItems: r.failed_items,
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

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables()
    const { id } = await ctx.params
    const jobId = String(id || "").trim()
    if (!jobId) return NextResponse.json({ error: "id inválido" }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const status = String(body?.status || "").trim() as JobStatus
    const allowed: JobStatus[] = ["queued", "running", "completed", "failed"]
    if (!allowed.includes(status)) return NextResponse.json({ error: "status inválido" }, { status: 400 })

    const client = await pool.connect()
    try {
      const result = await client.query(
        "UPDATE mass_action_jobs SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, status",
        [jobId, status],
      )
      if (!result.rows?.[0]) return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
      return NextResponse.json({ id: result.rows[0].id, status: result.rows[0].status })
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

