import type { AuditEvent, Classification, Draft, Lead } from "../domain/lead";

export interface LeadRepository {
  list(): Promise<Lead[]>;
  find(id: string): Promise<Lead | null>;
  findByEmail(email: string): Promise<Lead | null>;
  save(lead: Lead, event: AuditEvent): Promise<void>;
  audit(leadId: string): Promise<AuditEvent[]>;
  clear(): Promise<void>;
}

export interface LeadIntelligence {
  readonly name: string;
  classify(lead: Lead): Promise<Classification>;
  draft(lead: Lead): Promise<Omit<Draft, "createdAt">>;
}

export interface IdGenerator {
  (): string;
}

export interface Clock {
  (): string;
}

