import { describe, expect, it } from "vitest";
import { RelayService } from "../src/application/relay-service";
import { DomainError } from "../src/domain/lead";
import { DemoIntelligence } from "../worker/demo-intelligence";
import { MemoryLeadRepository } from "./memory-repository";

function harness() {
  const repository = new MemoryLeadRepository();
  let sequence = 0;
  const service = new RelayService(
    repository,
    new DemoIntelligence(),
    () => `2026-08-24T12:00:${String(sequence++).padStart(2, "0")}.000Z`,
    () => `id-${sequence++}`,
  );
  return { repository, service };
}

const input = {
  name: "  Maya Chen ",
  email: "MAYA@EXAMPLE.COM ",
  company: "Northstar Studio",
  source: "Website",
  message: "We need an automation roadmap before launch in three weeks. Budget is $18,000.",
};

describe("RelayService", () => {
  it("completes the controlled lead workflow and records each decision", async () => {
    const { service } = harness();
    const received = await service.receive(input);
    expect(received.email).toBe("maya@example.com");
    expect(received.status).toBe("received");

    const classified = await service.classify(received.id);
    expect(classified.status).toBe("classified");
    expect(classified.classification?.score).toBeGreaterThanOrEqual(60);
    expect(classified.classification?.reasons).toHaveLength(3);

    const drafted = await service.createDraft(received.id);
    expect(drafted.status).toBe("drafted");
    expect(drafted.draft?.body).toContain("Hi Maya");

    const approved = await service.approve(received.id);
    expect(approved.status).toBe("approved");
    expect(approved.approvedAt).not.toBeNull();

    const events = await service.audit(received.id);
    expect(events.map((event) => event.type)).toEqual([
      "lead.received",
      "lead.classified",
      "draft.created",
      "draft.approved",
    ]);
    expect(events.at(-1)?.detail).toContain("No email was sent");
  });

  it("rejects a duplicate email regardless of casing", async () => {
    const { service } = harness();
    await service.receive(input);
    await expect(service.receive({ ...input, email: "maya@example.com" })).rejects.toMatchObject<Partial<DomainError>>({
      code: "DUPLICATE_LEAD",
    });
  });

  it("prevents actions from skipping workflow stages", async () => {
    const { service } = harness();
    const lead = await service.receive(input);
    await expect(service.createDraft(lead.id)).rejects.toMatchObject<Partial<DomainError>>({ code: "INVALID_TRANSITION" });
  });

  it("seeds synthetic demo data at multiple workflow stages", async () => {
    const { service } = harness();
    const leads = await service.resetDemo();
    expect(leads).toHaveLength(3);
    expect(leads.map((lead) => lead.status).sort()).toEqual(["classified", "drafted", "received"]);
  });
});

