import type { LeadRepository } from "../src/application/contracts";
import type { AuditEvent, Lead } from "../src/domain/lead";

export class MemoryLeadRepository implements LeadRepository {
  readonly leads = new Map<string, Lead>();
  readonly events: AuditEvent[] = [];

  async list(): Promise<Lead[]> {
    return [...this.leads.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async find(id: string): Promise<Lead | null> {
    return this.leads.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return [...this.leads.values()].find((lead) => lead.email === email) ?? null;
  }

  async save(lead: Lead, event: AuditEvent): Promise<void> {
    this.leads.set(lead.id, structuredClone(lead));
    this.events.push(structuredClone(event));
  }

  async audit(leadId: string): Promise<AuditEvent[]> {
    return this.events.filter((event) => event.leadId === leadId);
  }

  async clear(): Promise<void> {
    this.leads.clear();
    this.events.length = 0;
  }
}

