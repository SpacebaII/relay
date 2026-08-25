# Relay Launch Content

## LinkedIn

I built Relay to explore a practical question: how much of lead intake can be automated without handing over the final decision?

Relay takes a synthetic inquiry, evaluates fit and urgency, drafts a response, and keeps approval with a person. Every state change is recorded in an audit trail.

The stack is React, TypeScript, Cloudflare Workers, and D1. The public demo uses deterministic scoring rules, so it has no model cost and the recommendation logic stays visible.

The most useful bug appeared during browser testing. The API saved a new lead correctly, but the React state update only replaced existing records. The new lead never appeared in the interface. I fixed the insertion path and kept that workflow as an end-to-end regression test.

Live demo: https://relay-lead-ops.spacebaii-portfolio.workers.dev

Source and case study: https://github.com/SpacebaII/relay

I would be interested to hear how teams handling inbound work decide what should be automated and what should stay under human review.

## DEV Community

Title: Building Relay: a zero-cost lead workflow with human approval

I built Relay as a small, production-minded experiment in lead operations. The question was not whether software could draft a response. The harder question was where automation should stop.

Small agencies and consultants often receive inquiries through forms, referrals, and inboxes. Someone still has to identify urgency, estimate fit, route the opportunity, and write a useful reply. Relay handles that repetitive interpretation while keeping approval and every external action with a person.

The live workflow has five visible steps:

1. Receive an inbound lead.
2. Evaluate fit, urgency, and commercial signals.
3. Show the score and the reasons behind it.
4. Generate a follow-up draft.
5. Record human approval without sending an email.

### Why I kept the architecture small

Relay uses one Cloudflare Worker for the API and React application, with D1 for persistence. The domain rules are separated from infrastructure through repository and intelligence interfaces, but the project still has one deployment surface.

Splitting the MVP into several services would have added configuration and failure modes without improving the product. The current structure keeps the workflow testable and leaves room to replace the database or intelligence provider later.

The public deployment uses deterministic rules instead of a live model. That choice keeps the demo free, makes every score repeatable, and prevents an unauthenticated endpoint from creating model charges. An optional server-side OpenAI adapter remains available for private evaluation.

### The bug that changed my testing strategy

The API tests said a newly submitted lead was saved. The first browser test told a different story.

The React update function mapped over the existing list and replaced a matching record. That worked for classification and approval updates. It failed for creation because a new ID did not already exist in the list. The backend succeeded, but the new lead never appeared on screen.

The fix was small: replace an existing record when found, otherwise prepend the new one. The important part was keeping the failing browser workflow as a regression test. It now proves that persistence and visible interface state stay coordinated.

### What production verification covered

I treated deployment as another engineering stage, not the finish line. The production checks completed the full workflow with synthetic data and verified the final D1 record and four audit events.

I also checked the mobile layout at 390 pixels, security headers, duplicate handling, oversized input rejection, unknown routes, and API cache controls. The deployed Worker is fixed to demo mode and has no model secret.

One deployment issue had nothing to do with application code. The Cloudflare account did not have a `workers.dev` namespace, and the first name Wrangler tried was unavailable. After registering a portfolio namespace, TLS still needed a short provisioning interval. I waited for a successful HTTPS response before treating the launch as complete.

### What I would build next

The next useful experiment is an evaluation dataset. I would label 30 to 50 synthetic inquiries, compare deterministic and model-assisted classifications, and measure agreement, explanation quality, latency, and token cost.

That would make the intelligence layer measurable instead of relying on a feature claim.

Live demo: https://relay-lead-ops.spacebaii-portfolio.workers.dev

Source, architecture notes, and case study: https://github.com/SpacebaII/relay
