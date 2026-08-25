import type { LeadIntelligence } from "../src/application/contracts";
import type { Classification, Lead, Rating } from "../src/domain/lead";

const urgentTerms = ["urgent", "asap", "immediately", "this week", "three weeks", "launch"];
const valueTerms = ["budget", "$", "enterprise", "team", "company", "roadmap"];
const fitTerms = ["automation", "workflow", "software", "portal", "ai", "integration"];

function hits(text: string, terms: string[]): number {
  return terms.filter((term) => text.includes(term)).length;
}

function rating(value: number): Rating {
  if (value >= 2) return "high";
  if (value === 1) return "medium";
  return "low";
}

export class DemoIntelligence implements LeadIntelligence {
  readonly name = "demo-rules-v1";

  async classify(lead: Lead): Promise<Classification> {
    const text = `${lead.company} ${lead.message}`.toLowerCase();
    const fitHits = hits(text, fitTerms);
    const urgencyHits = hits(text, urgentTerms);
    const valueHits = hits(text, valueTerms);
    const score = Math.min(98, 32 + fitHits * 14 + urgencyHits * 9 + valueHits * 8);
    const owner = fitHits >= 2 ? "Strategy" : score >= 60 ? "Growth" : "General";
    const reasons = [
      fitHits ? `${fitHits} service-fit signal${fitHits === 1 ? "" : "s"} detected` : "No strong service-fit language detected",
      urgencyHits ? `${urgencyHits} timing signal${urgencyHits === 1 ? "" : "s"} detected` : "No explicit deadline detected",
      valueHits ? `${valueHits} commercial signal${valueHits === 1 ? "" : "s"} detected` : "Budget and team scope are unclear",
    ];

    return {
      fit: rating(fitHits),
      urgency: rating(urgencyHits),
      value: rating(valueHits),
      score,
      owner,
      summary: `${lead.company} has a ${rating(fitHits)}-fit inquiry with ${rating(urgencyHits)} urgency and ${rating(valueHits)} commercial potential.`,
      reasons,
      confidence: Math.min(0.94, 0.58 + (fitHits + urgencyHits + valueHits) * 0.05),
      provider: this.name,
    };
  }

  async draft(lead: Lead) {
    return {
      subject: `Next steps for ${lead.company}`,
      body: `Hi ${lead.name.split(" ")[0]},\n\nThanks for reaching out. I reviewed your note, and it sounds like a focused discovery call would help us clarify the outcome, constraints, and the fastest practical path.\n\nWould a 30-minute conversation this week work for you? I can then follow up with a concise recommendation and next steps.\n\nBest,\nThe Relay demo team`,
      provider: this.name,
    };
  }
}
