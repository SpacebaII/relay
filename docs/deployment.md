# Zero-Cost Deployment Guide

Relay is designed for Cloudflare's Workers Free plan and D1 Free plan. Static assets, the API, and the database deploy as one small system. A custom domain is optional.

## Safety baseline

The public portfolio deployment must keep `AI_MODE` set to `demo`. This prevents API spend even if the public endpoint receives unexpected traffic. Never place an API key in `wrangler.jsonc`, client code, GitHub Actions, or a `.dev.vars` file committed to Git.

## Reproducing the deployment

1. Install dependencies and authenticate Wrangler:

   ```bash
   npm install
   npx wrangler login
   ```

2. Create a free D1 database in your own Cloudflare account:

   ```bash
   npx wrangler d1 create relay-db
   ```

3. Copy the returned `database_id` into `wrangler.jsonc`. The checked-in ID belongs to the published Relay deployment and will not be accessible from another Cloudflare account.

4. Apply the schema remotely:

   ```bash
   npm run db:remote
   ```

5. Run the complete validation suite:

   ```bash
   npm run check
   npm run test:e2e
   ```

6. Deploy:

   ```bash
   npm run deploy
   ```

Wrangler returns a `*.workers.dev` URL. Open it, add a synthetic lead, complete an approval, and confirm that no email is sent.

## Published environment

- URL: [relay-lead-ops.spacebaii-portfolio.workers.dev](https://relay-lead-ops.spacebaii-portfolio.workers.dev)
- Worker: `relay-lead-ops`
- Storage: D1 in Cloudflare's WNAM region
- Intelligence mode: `demo`
- Model secrets: none
- Custom domain: none

The public form writes to a shared demonstration database. Use synthetic information only.

## Optional private OpenAI evaluation

Live model use is for a private, access-controlled environment only. Set the secret through Wrangler so the key remains server-side:

```bash
npx wrangler secret put OPENAI_API_KEY
```

Then change `AI_MODE` to `openai` only in the protected environment. The default model can be changed through `OPENAI_MODEL`. Restore `AI_MODE=demo` before publishing an unauthenticated portfolio URL.

## Rollback

Cloudflare retains Worker versions. If smoke testing finds a regression, use the Cloudflare dashboard's Workers deployment history to roll back to the last verified version. Database schema changes should be additive until a separate data-migration strategy is introduced.

## Free-tier maintenance

Free-tier terms can change. Recheck current Worker and D1 limits before each public launch. Relay fails when a free limit is exhausted; the checked-in configuration does not subscribe to paid usage.
