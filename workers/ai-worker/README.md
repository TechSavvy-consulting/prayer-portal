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

For Wrangler deployment, use either `wrangler login` or an API token with Worker deploy access for the account.

Recommended API token permissions:

```text
Account > Workers Scripts > Edit
User > Memberships > Read
```

Wrangler needs `User > Memberships > Read` to discover/confirm account access. It needs `Account > Workers Scripts > Edit` to deploy the Worker and update its secret bindings.

Tokens with only `Apps:Edit` or similar dashboard/app permissions are not enough for Worker deploys.
