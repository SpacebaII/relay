# Development Journal

This journal captures evidence for the eventual case study. Entries record decisions and obstacles while they are fresh.

## 2026-08-24: Project inception

### Starting state

The workspace was empty. The product direction, zero-dollar infrastructure constraint, and requirement for an eventual public case study came from the discovery conversation.

### Decisions

- Chose agencies and consultancies as the first niche because their lead intake is easy to demonstrate and has a direct business outcome.
- Chose a human approval boundary instead of autonomous sending. This makes AI assistance useful while keeping accountability explicit.
- Chose a single Cloudflare Worker plus D1 to preserve a real persistence layer without a paid service or multi-service deployment.
- Defined a deterministic intelligence provider as the public-demo default so reviewers can evaluate the entire workflow without an API key.

### Risks to validate

- Cloudflare Vite development and D1 migrations must behave consistently on Windows.
- The interface must make workflow state and AI rationale understandable at a glance.
- The deterministic provider must be clearly labeled so the demo never misrepresents rules as model output.

## 2026-08-24: First vertical slice

### Implemented

- Domain-enforced lead states and duplicate validation
- D1 repository with batched lead and audit-event writes
- Deterministic and OpenAI intelligence providers behind one interface
- Responsive lead queue, assessment, draft, approval, and audit interface
- Unit, application integration, and end-to-end browser tests

### Defect found by browser testing

A newly persisted lead did not appear in the React queue. The client update path only replaced existing array items and never inserted a new result. The fix now branches on identity: update an existing lead or prepend a newly created one. The failing workflow became a permanent end-to-end regression test.

### Visual QA findings

- Rewrote an awkward deterministic response template that passed tests but read poorly in the rendered product.
- Kept summary cards in two columns on small screens to reduce scrolling before the primary queue.
- Confirmed the mobile layout has no horizontal overflow at a 390-pixel viewport.

### Validation evidence

- Production build succeeded with the Cloudflare Vite plugin.
- Five unit/application tests passed with coverage thresholds.
- Two Chromium end-to-end workflows passed against local Worker and D1 bindings.
- Desktop and mobile screenshots were generated from synthetic seeded data.

## 2026-08-24: Public launch

### Deployment work

- Created the production D1 database in Cloudflare's WNAM region and applied the schema.
- Replaced the placeholder database binding with the production database ID.
- Generated Worker environment types from `wrangler.jsonc` and added a CI drift check.
- Enabled `nodejs_compat`, structured error logging, Worker logs, and sampled traces.
- Registered `spacebaii-portfolio.workers.dev` after the first-choice namespace was unavailable.
- Deployed Worker version `ff3ea7db-8d04-491b-9755-dc40dca9efa1` with `AI_MODE=demo` and no OpenAI secret.

### Production findings

- TLS required a short provisioning interval after the first deployment. Publication was not considered complete until HTTPS returned `200`.
- The form disclosure incorrectly said data was stored locally. It now tells visitors that the public demo uses shared storage and accepts synthetic information only.
- Server-side length limits now bound every lead field before persistence.
- A synthetic production lead completed all four workflow states and persisted four audit events.
- Structured `400`, `404`, and `409` responses were verified against the public API.
- Security headers and `Cache-Control: no-store` were verified over HTTPS.
- A 390-pixel production viewport had no horizontal overflow.

## 2026-08-25: Interface credibility pass

### Problem

The first public interface worked, but its dark sidebar, bright accent, oversized slogan, repeated cards, and decorative navigation made the product look broader and more polished than the implemented workflow justified. The sample queue was also too evenly distributed to resemble daily operational work.

### Decisions

- Replaced the sidebar and decorative routes with a compact utility header and one review workbench.
- Removed glowing status treatments, generic icons, avatar initials, and repeated reassurance labels.
- Made search and status filters functional instead of using navigation as decoration.
- Added record identifiers, source details, timestamps, engine version, uneven queue states, and a numbered decision ledger.
- Kept one obvious next action for the selected record and one concise demo boundary disclosure.

### Validation evidence

- Three end-to-end workflows cover review, lead creation, and real queue filtering.
- Search and filter controls are locked while a reset or workflow mutation is in flight, preventing stale responses from overwriting a reviewer action.
- Desktop and 390-pixel mobile visual checks confirmed the new hierarchy and no horizontal overflow.
- Public screenshots now show the same operational interface reviewers use in the live demo.

### Lesson

Credibility comes from honest constraints and useful detail. Removing features the product did not have made the implemented workflow feel more complete, not less.
