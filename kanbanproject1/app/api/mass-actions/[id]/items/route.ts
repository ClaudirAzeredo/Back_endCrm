import { NextResponse } from "next/server"
import pool from "@/lib/db"

type ItemStatus = "queued" | "sent" | "failed" | "skipped"

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

      CREATE TABLE IF NOT EXISTS mass_action_job_items (
        id VARCHAR(255) PRIMARY KEY,
        job_id VARCHAR(255) NOT NULL,
        lead_id VARCHAR(255) NOT NULL,
        phone VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        error_message TEXT NULL,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_mass_action_job_items_job_id ON mass_action_job_items(job_id);
      CREATE INDEX IF NOT EXISTS idx_mass_action_job_items_job_status ON mass_action_job_items(job_id, status);
      `,
    )
  } finally {
    client.release()
  }
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables()
    const { id } = await ctx.params
    const jobId = String(id || "").trim()
    if (!jobId) return NextResponse.json({ error: "id inválido" }, { status: 400 })

    const url = new URL(request.url)
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 200), 1), 500)
    const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0)
    const status = url.searchParams.get("status")

    const client = await pool.connect()
    try {
      const params: any[] = [jobId]
      let where = "WHERE job_id = $1"
      if (status) {
        params.push(String(status))
        where += ` AND status = $${params.length}`
      }
      params.push(limit)
      params.push(offset)
      const result = await client.query(
        `SELECT * FROM mass_action_job_items ${where} ORDER BY created_at ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params,
      )
      const rows = result.rows.map((r) => ({
        id: r.id,
        jobId: r.job_id,
        leadId: r.lead_id,
        phone: r.phone,
        status: r.status as ItemStatus,
        errorMessage: r.error_message || null,
        sentAt: r.sent_at ? (r.sent_at instanceof Date ? r.sent_at.toISOString() : String(r.sent_at)) : null,
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

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await ensureTables()
    const { id } = await ctx.params
    const jobId = String(id || "").trim()
    if (!jobId) return NextResponse.json({ error: "id inválido" }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const itemId = String(body?.itemId || "").trim()
    const status = String(body?.status || "").trim() as ItemStatus
    const errorMessage = body?.errorMessage ? String(body.errorMessage) : null
    const sentAtIso = body?.sentAt ? String(body.sentAt) : null
    const allowed: ItemStatus[] = ["queued", "sent", "failed", "skipped"]
    if (!itemId) return NextResponse.json({ error: "itemId é obrigatório" }, { status: 400 })
    if (!allowed.includes(status)) return NextResponse.json({ error: "status inválido" }, { status: 400 })

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      const updated = await client.query(
        `
        WITH prev AS (
          SELECT id, status
          FROM mass_action_job_items
          WHERE id = $1 AND job_id = $2
        ), upd AS (
          UPDATE mass_action_job_items
          SET status = $3,
              error_message = $4,
              sent_at = CASE WHEN $5 IS NULL THEN sent_at ELSE $5::timestamptz END,
              updated_at = NOW()
          WHERE id = $1 AND job_id = $2
          RETURNING id, job_id, status
        )
        SELECT prev.status AS prev_status, upd.status AS new_status, upd.id AS id
        FROM prev
        JOIN upd ON upd.id = prev.id
        `,
        [itemId, jobId, status, errorMessage, sentAtIso],
      )

      const row = updated.rows?.[0]
      if (!row) {
        await client.query("ROLLBACK")
        return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
      }

      const prevStatus = String(row.prev_status)
      const newStatus = String(row.new_status)

      const sentDelta = (s: string) => (s === "sent" ? 1 : 0)
      const failDelta = (s: string) => (s === "failed" ? 1 : 0)

      const deltaSent = sentDelta(newStatus) - sentDelta(prevStatus)
      const deltaFailed = failDelta(newStatus) - failDelta(prevStatus)

      if (deltaSent !== 0 || deltaFailed !== 0) {
        await client.query(
          "UPDATE mass_action_jobs SET sent_items = sent_items + $2, failed_items = failed_items + $3, updated_at = NOW() WHERE id = $1",
          [jobId, deltaSent, deltaFailed],
        )
      } else {
        await client.query("UPDATE mass_action_jobs SET updated_at = NOW() WHERE id = $1", [jobId])
      }

      await client.query("COMMIT")
      return NextResponse.json({ id: itemId, status })
    } catch (e) {
      try {
        await client.query("ROLLBACK")
      } catch {}
      throw e
    } finally {
      client.release()
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

