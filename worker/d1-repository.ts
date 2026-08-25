import type { LeadRepository } from "../src/application/contracts";
import type { AuditEvent, Lead } from "../src/domain/lead";

interface LeadRow {
  data: string;
}

interface AuditRow {
  data: string;
}

export class D1LeadRepository implements LeadRepository {
  constructor(private readonly db: D1Database) {}

  async list(): Promise<Lead[]> {
    const result = await this.db.prepare("SELECT data FROM leads ORDER BY created_at DESC").all<LeadRow>();
    return result.results.map((row) => JSON.parse(row.data) as Lead);
  }

  async find(id: string): Promise<Lead | null> {
    const row = await this.db.prepare("SELECT data FROM leads WHERE id = ?").bind(id).first<LeadRow>();
    return row ? (JSON.parse(row.data) as Lead) : null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const row = await this.db.prepare("SELECT data FROM leads WHERE email = ?").bind(email).first<LeadRow>();
    return row ? (JSON.parse(row.data) as Lead) : null;
  }

  async save(lead: Lead, event: AuditEvent): Promise<void> {
    await this.db.batch([
      this.db
        .prepare("INSERT INTO leads (id, email, status, created_at, updated_at, data) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET email = excluded.email, status = excluded.status, updated_at = excluded.updated_at, data = excluded.data")
        .bind(lead.id, lead.email, lead.status, lead.createdAt, lead.updatedAt, JSON.stringify(lead)),
      this.db
        .prepare("INSERT INTO audit_events (id, lead_id, created_at, data) VALUES (?, ?, ?, ?)")
        .bind(event.id, event.leadId, event.createdAt, JSON.stringify(event)),
    ]);
  }

  async audit(leadId: string): Promise<AuditEvent[]> {
    const result = await this.db
      .prepare("SELECT data FROM audit_events WHERE lead_id = ? ORDER BY created_at ASC, id ASC")
      .bind(leadId)
      .all<AuditRow>();
    return result.results.map((row) => JSON.parse(row.data) as AuditEvent);
  }

  async clear(): Promise<void> {
    await this.db.batch([this.db.prepare("DELETE FROM audit_events"), this.db.prepare("DELETE FROM leads")]);
  }
}

