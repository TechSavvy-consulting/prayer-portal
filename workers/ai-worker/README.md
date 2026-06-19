# Prayer Portal AI Worker

Cloudflare Worker backend for Gemini-powered prayer generation.

## Required Secrets

Set this secret in Cloudflare. Do not commit it.

```bat
npm run worker:secret
```

Secret name:

```text
GEMINI_API_KEY
```

Use the key copied directly from Google AI Studio.

## Deploy

```bat
npm run worker:deploy
```

After deployment, set the deployed `/generate` endpoint in the root `ai-config.js` file:

```js
window.PRAYER_PORTAL_AI_URL = "https://prayer-portal-ai.your-subdomain.workers.dev/generate";
```

Then commit and push `ai-config.js`.

## Cloudflare Token Permissions

For Wrangler deployment, use either `wrangler login` or an API token with Worker deploy access for the account. If using an API token, it must be able to deploy Workers scripts and discover or target the account.

The token pasted during setup appeared to have `Apps:Edit`, which is not enough for Wrangler Worker deploys.
