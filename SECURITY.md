# Security Policy

Relay is a portfolio MVP and should process synthetic data in its public demo.

## Reporting

Please open a private security advisory in the repository rather than a public issue when reporting a vulnerability.

## Current boundaries

- The public demo is intentionally unauthenticated and must use synthetic data.
- Email delivery and CRM writes are not implemented.
- OpenAI credentials are Worker secrets and must never be placed in the client bundle.
- Live AI mode must not be enabled on an unauthenticated public deployment.

Authentication, tenant isolation, abuse controls, and data-retention policies are required before Relay handles real customer data.

