# Case Study: Building Relay

## Summary

Relay is a shippable lead-operations MVP for small agencies and consultancies. It converts inbound inquiries into transparent assessments and follow-up drafts, while reserving approval and all external side effects for a person.

The project was constrained to a zero-dollar infrastructure baseline. That constraint shaped the architecture: a single Cloudflare Worker serves a React interface and API, while D1 provides persistent storage. A deterministic provider powers the public demo, and an optional server-side OpenAI adapter demonstrates structured model integration without making model spend mandatory.

## The problem

Small service teams often handle sales intake alongside client delivery. The repetitive work—reading inquiries, identifying urgency and fit, routing opportunities, and drafting replies—is automatable. The consequential work—deciding what is true, appropriate, and ready to send—still benefits from human judgment.

Relay tests a narrow hypothesis: assistance becomes more trustworthy when recommendations include their reasons and approval is a first-class workflow state rather than an afterthought.

## Constraints

- No infrastructure cost beyond intentionally used model tokens
- No real email delivery or accidental external action
- No browser exposure of model credentials
- A public demo that remains useful without an API key
- Professional documentation, testing, responsive design, and deployment preparation

## Architecture decision

A multi-service system would have looked sophisticated but added little product value. Relay instead uses clean architecture inside one deployment. Domain rules have no platform dependencies; the application service depends on repository and intelligence interfaces; D1, deterministic rules, OpenAI, HTTP, and React remain adapters.

This design is intentionally reversible. The API, worker, or provider can move later without rewriting workflow rules, but the MVP retains one deployment and one operational surface.

## Development challenge 1: Persisted state did not appear in the UI

The first browser tests submitted and persisted a new lead successfully, but the interface never displayed it. The update function assumed every API result already existed in the current React collection, so it mapped over the collection without inserting new records.

The fix distinguished creation from update: replace a matching item when one exists; otherwise prepend the new result. A Playwright test now submits a lead and verifies that the new record becomes selected with classification available as the next explicit action.

**Lesson:** backend success is not feature success. Browser-level verification caught a state-coordination defect that domain and API tests could not.

## Development challenge 2: Correct output was not good output

The deterministic provider originally produced a grammatically awkward sentence by splicing a generated summary into a response template. All automated tests passed because the response contained the expected name and workflow state.

Visual QA exposed the quality problem. The summary was rewritten as a stable assessment statement, and the draft template stopped reusing an uncontrolled sentence fragment.

**Lesson:** assertions protect behavior, while visual and editorial review protect credibility. Portfolio software needs both.

## Development challenge 3: Responsive density

The first mobile layout stacked four summary cards into a long column before the user could reach the queue. It had no horizontal overflow and was technically responsive, but it was inefficient.

The smallest breakpoint now retains a two-column summary, reducing the distance to the primary workflow while preserving readable tap targets and card labels.

**Lesson:** passing responsive checks is a baseline. Information hierarchy should be evaluated at each breakpoint.

## Reliability and safety

- Legal state transitions are enforced in the domain layer.
- Lead emails are normalized and unique.
- Each state change and actor is recorded in the audit trail.
- The public demo uses transparent deterministic rules.
- The optional OpenAI adapter requests strict JSON Schema output, disables storage, and caps output tokens.
- The Content Security Policy allows browser connections only to Relay itself.
- CI validates lint, types, coverage thresholds, builds, and end-to-end workflows.

## Outcome

Relay delivers the complete lead → assessment → draft → approval → audit-trail workflow in a responsive application. It is reproducible from synthetic data, deployable on a free platform baseline, and structured for future authenticated integrations without pretending those concerns are already solved.

## Next experiment

The most valuable next step is not another integration. It is an evaluation dataset: label 30–50 synthetic inquiries, compare deterministic and model-assisted classifications, and measure agreement, explanation quality, latency, and token cost. That would turn “AI-assisted” from a feature claim into an observable product capability.

