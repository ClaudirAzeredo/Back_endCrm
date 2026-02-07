import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

type JobStatus = "queued" | "running" | "completed" | "failed"
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

      CREATE INDEX IF NOT EXISTS idx_mass_action_jobs_created_at ON mass_action_jobs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_mass_action_job_items_job_id ON mass_action_job_items(job_id);
      CREATE INDEX IF NOT EXISTS idx_mass_action_job_items_job_status ON mass_action_job_items(job_id, status);
      `,
    )
  } finally {
    client.release()
  }
}

export async function GET(request: Request) {
  try {
    await ensureTables()
    const url = new URL(request.url)
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 30), 1), 200)
    const client = await pool.connect()
    try {
      const result = await client.query(
        "SELECT * FROM mass_action_jobs ORDER BY created_at DESC LIMIT $1",
        [limit],
      )
      const rows = result.rows.map((r) => ({
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
    await ensureTables()
    const body = await request.json().catch(() => ({}))

    const createdBy = body?.createdBy ?? {}
    const templateId = String(body?.templateId || "").trim()
    const templateSnapshot = body?.templateSnapshot ?? {}
    const filterPayload = body?.filterPayload ?? {}
    const throttling = body?.throttling ?? {}
    const idempotencyKey = body?.idempotencyKey ? String(body.idempotencyKey) : null

    const targets: Array<{ leadId: string; phones: string[] }> = Array.isArray(body?.targets) ? body.targets : []

    if (!templateId) {
      return NextResponse.json({ error: "templateId é obrigatório" }, { status: 400 })
    }

    const cleanedTargets = targets
      .map((t) => ({
        leadId: String(t?.leadId || "").trim(),
        phones: Array.isArray(t?.phones) ? t.phones.map((p) => String(p || "").trim()).filter(Boolean) : [],
      }))
      .filter((t) => t.leadId && t.phones.length > 0)

    const totalLeads = cleanedTargets.length
    const totalItems = cleanedTargets.reduce((acc, t) => acc + t.phones.length, 0)

    if (totalItems <= 0) {
      return NextResponse.json({ error: "Nenhum destinatário válido para disparo" }, { status: 400 })
    }
    if (totalItems > 5000) {
      return NextResponse.json({ error: "Disparo excede o limite máximo por execução" }, { status: 400 })
    }

    const client = await pool.connect()
    try {
      await client.query("BEGIN")

      if (idempotencyKey) {
        const existing = await client.query("SELECT id FROM mass_action_jobs WHERE idempotency_key = $1", [idempotencyKey])
        if (existing.rows?.[0]?.id) {
          await client.query("ROLLBACK")
          return NextResponse.json({ id: existing.rows[0].id })
        }
      }

      const jobId = uuidv4()
      await client.query(
        "INSERT INTO mass_action_jobs (id, idempotency_key, created_by, template_id, template_snapshot, filter_payload, throttling, status, total_leads, total_items, sent_items, failed_items, created_at, updated_at) VALUES ($1, $2, $3::jsonb, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10, 0, 0, NOW(), NOW())",
        [
          jobId,
          idempotencyKey,
          JSON.stringify(createdBy),
          templateId,
          JSON.stringify(templateSnapshot),
          JSON.stringify(filterPayload),
          JSON.stringify(throttling),
          "queued",
          totalLeads,
          totalItems,
        ],
      )

      const itemRows: Array<{ id: string; jobId: string; leadId: string; phone: string; status: ItemStatus }> = []
      for (const t of cleanedTargets) {
        for (const phone of t.phones) {
          itemRows.push({ id: uuidv4(), jobId, leadId: t.leadId, phone, status: "queued" })
        }
      }

      const values: any[] = []
      const chunks: string[] = []
      let idx = 1
      for (const it of itemRows) {
        chunks.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, NOW(), NOW())`)
        values.push(it.id, it.jobId, it.leadId, it.phone, it.status)
      }
      await client.query(
        `INSERT INTO mass_action_job_items (id, job_id, lead_id, phone, status, created_at, updated_at) VALUES ${chunks.join(",")}`,
        values,
      )

      await client.query("COMMIT")
      return NextResponse.json({ id: jobId }, { status: 201 })
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
