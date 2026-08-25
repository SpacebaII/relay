export const leadStatuses = ["received", "classified", "drafted", "approved"] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export type Rating = "low" | "medium" | "high";

export interface LeadInput {
  name: string;
  email: string;
  company: string;
  message: string;
  source?: string;
}

export interface Classification {
  fit: Rating;
  urgency: Rating;
  value: Rating;
  score: number;
  owner: "Growth" | "Strategy" | "General";
  summary: string;
  reasons: string[];
  confidence: number;
  provider: string;
}

export interface Draft {
  subject: string;
  body: string;
  provider: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  message: string;
  source: string;
  status: LeadStatus;
  classification: Classification | null;
  draft: Draft | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
}

export type AuditEventType =
  | "lead.received"
  | "lead.classified"
  | "draft.created"
  | "draft.approved";

export interface AuditEvent {
  id: string;
  leadId: string;
  type: AuditEventType;
  actor: "user" | "relay";
  detail: string;
  createdAt: string;
}

export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export function createLead(input: LeadInput, now: string, id: string): Lead {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const company = input.company.trim();
  const message = input.message.trim();

  if (!name || !company || !message) {
    throw new DomainError("INVALID_LEAD", "Name, company, and message are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new DomainError("INVALID_EMAIL", "Enter a valid email address.");
  }
  if (name.length > 80 || email.length > 254 || company.length > 120 || message.length > 2000) {
    throw new DomainError("INVALID_LEAD", "Lead details exceed the supported demo limits.");
  }
  if ((input.source?.trim().length ?? 0) > 40) {
    throw new DomainError("INVALID_LEAD", "Lead source exceeds the supported demo limit.");
  }

  return {
    id,
    name,
    email,
    company,
    message,
    source: input.source?.trim() || "Website",
    status: "received",
    classification: null,
    draft: null,
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
  };
}

export function requireStatus(lead: Lead, expected: LeadStatus): void {
  if (lead.status !== expected) {
    throw new DomainError(
      "INVALID_TRANSITION",
      `Lead must be ${expected} before this action; current status is ${lead.status}.`,
    );
  }
}
