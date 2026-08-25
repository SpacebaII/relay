# Relay Launch Report

## Published artifacts

- Live application: [relay-lead-ops.spacebaii-portfolio.workers.dev](https://relay-lead-ops.spacebaii-portfolio.workers.dev)
- Source repository: [github.com/SpacebaII/relay](https://github.com/SpacebaII/relay)
- Continuous integration: [GitHub Actions CI](https://github.com/SpacebaII/relay/actions/workflows/ci.yml)
- Release: [Relay v0.1.0](https://github.com/SpacebaII/relay/releases/tag/v0.1.0)
- Case study: [Building Relay](case-study.md)
- Launch drafts: [LinkedIn and DEV content](launch-content.md)

## Deployment evidence

- Platform: Cloudflare Workers and D1
- Worker: `relay-lead-ops`
- Worker version: `f10ec6fb-f18f-423b-b591-0bc141035135`
- D1 location: WNAM
- Intelligence mode: deterministic `demo`
- OpenAI secret binding: absent
- Paid resources: none

## Verification evidence

- Six unit and application tests passed.
- Three Chromium end-to-end workflows passed locally.
- The redesigned workflow suite passed nine consecutive browser runs across three repetitions.
- The timing fix passed five consecutive two-test browser suites, followed by a three-repeat serial verification.
- Line coverage reached 95.69 percent.
- The production workflow reached `approved` with four persisted audit events.
- Desktop and 390-pixel mobile layouts were verified without horizontal overflow.
- HTTPS, static assets, API routing, and D1 persistence were verified.
- CSP, Permissions Policy, Referrer Policy, and content-type protection were present.
- Duplicate, oversized, and unknown-route responses returned `409`, `400`, and `404` respectively.
- API responses used `Cache-Control: no-store`.

## Issues encountered

1. The first deployment could not claim the unavailable `relay.workers.dev` account namespace. A reusable `spacebaii-portfolio` namespace resolved it.
2. TLS certificate provisioning briefly returned a handshake error. Verification waited for a successful HTTPS response.
3. The public form still described storage as local. The disclosure was corrected to identify the shared synthetic-data demo.
4. Handwritten Worker environment types could drift from deployment configuration. Wrangler-generated bindings and a CI drift check replaced them.
5. A final browser rerun exposed a reset-and-select race. Lead rows are now disabled while workflow requests are active, and five consecutive two-test suites passed after the fix.
6. Parallel stress reruns collided because all browser workers shared one mutable local D1 database. The suite now uses one worker explicitly, matching its fixture isolation.
7. The first visual system implied more product depth than the implemented workflow. The redesign removed decorative navigation and generic SaaS styling, then replaced it with one operational review desk whose search, filters, record actions, and decision history are all functional.

## Remaining roadmap

- Editable drafts with revision history
- Authenticated workspaces and role-based approval
- Configurable qualification rules
- Abuse controls before accepting real traffic or data
- An evaluation dataset comparing deterministic and model-assisted classification
- Conversion analytics and response-time reporting
