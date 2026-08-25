import {
  createLead,
  DomainError,
  requireStatus,
  type AuditEvent,
  type Lead,
  type LeadInput,
} from "../domain/lead";
import type { Clock, IdGenerator, LeadIntelligence, LeadRepository } from "./contracts";

export class RelayService {
  constructor(
    private readonly repository: LeadRepository,
    private readonly intelligence: LeadIntelligence,
    private readonly clock: Clock = () => new Date().toISOString(),
    private readonly id: IdGenerator = () => crypto.randomUUID(),
  ) {}

  list(): Promise<Lead[]> {
    return this.repository.list();
  }

  audit(leadId: string): Promise<AuditEvent[]> {
    return this.repository.audit(leadId);
  }

  async receive(input: LeadInput): Promise<Lead> {
    const duplicate = await this.repository.findByEmail(input.email.trim().toLowerCase());
    if (duplicate) {
      throw new DomainError("DUPLICATE_LEAD", "A lead with this email already exists.");
    }

    const now = this.clock();
    const lead = createLead(input, now, this.id());
    await this.repository.save(lead, this.event(lead, "lead.received", "user", `Lead received from ${lead.source}.`, now));
    return lead;
  }

  async classify(id: string): Promise<Lead> {
    const lead = await this.get(id);
    requireStatus(lead, "received");
    const now = this.clock();
    const classification = await this.intelligence.classify(lead);
    const updated: Lead = { ...lead, classification, status: "classified", updatedAt: now };
    await this.repository.save(
      updated,
      this.event(updated, "lead.classified", "relay", `Scored ${classification.score}/100 and routed to ${classification.owner}.`, now),
    );
    return updated;
  }

  async createDraft(id: string): Promise<Lead> {
    const lead = await this.get(id);
    requireStatus(lead, "classified");
    const now = this.clock();
    const generated = await this.intelligence.draft(lead);
    const updated: Lead = {
      ...lead,
      draft: { ...generated, createdAt: now },
      status: "drafted",
      updatedAt: now,
    };
    await this.repository.save(
      updated,
      this.event(updated, "draft.created", "relay", `Follow-up draft created with ${this.intelligence.name}.`, now),
    );
    return updated;
  }

  async approve(id: string): Promise<Lead> {
    const lead = await this.get(id);
    requireStatus(lead, "drafted");
    const now = this.clock();
    const updated: Lead = { ...lead, status: "approved", approvedAt: now, updatedAt: now };
    await this.repository.save(
      updated,
      this.event(updated, "draft.approved", "user", "Draft approved for simulated handoff. No email was sent.", now),
    );
    return updated;
  }

  async resetDemo(): Promise<Lead[]> {
    await this.repository.clear();
    const samples: LeadInput[] = [
      {
        name: "Maya Chen",
        email: "maya@northstar-studio.example",
        company: "Northstar Studio",
        source: "Website",
        message: "We need a workflow audit and automation roadmap before our product launch in three weeks. Budget is around $18,000.",
      },
      {
        name: "Andre Lewis",
        email: "andre@fieldnote.example",
        company: "Fieldnote Research",
        source: "Referral",
        message: "Our five-person team is comparing partners for a customer research portal this quarter. Could we discuss approach and pricing?",
      },
      {
        name: "Sam Rivera",
        email: "sam@brightpath.example",
        company: "BrightPath Coaching",
        source: "LinkedIn",
        message: "Curious whether you offer a small website refresh. No firm timeline yet and I am gathering ideas.",
      },
      {
        name: "Keisha Grant",
        email: "keisha@grant-field.example",
        company: "Grant & Field",
        source: "Email",
        message: "Following up after last Thursday's workshop. We have client intake in two spreadsheets and a shared inbox. Not sure whether the first step is cleanup or automation. Could someone look at the process before month-end?",
      },
      {
        name: "Omar Haddad",
        email: "omar@meridian-fabrication.example",
        company: "Meridian Fabrication",
        source: "Event",
        message: "Met at the operations breakfast. We need a small internal tool to track quoting handoffs between sales and production. Six users to start; budget has not been approved yet.",
      },
    ];

    const leads: Lead[] = [];
    for (const sample of samples) leads.push(await this.receive(sample));
    await this.classify(leads[0].id);
    await this.createDraft(leads[0].id);
    await this.classify(leads[1].id);
    await this.classify(leads[4].id);
    return this.list();
  }

  private async get(id: string): Promise<Lead> {
    const lead = await this.repository.find(id);
    if (!lead) throw new DomainError("NOT_FOUND", "Lead not found.");
    return lead;
  }

  private event(
    lead: Lead,
    type: AuditEvent["type"],
    actor: AuditEvent["actor"],
    detail: string,
    now: string,
  ): AuditEvent {
    return { id: this.id(), leadId: lead.id, type, actor, detail, createdAt: now };
  }
}
