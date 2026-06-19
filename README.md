# Prayer Portal

Local, API-free prayer generator built from a sanitized style profile extracted from the SMS backup. The interface is mobile-first, with a dark devotional app style, Christian cross graphics, quick prayer setup controls, repeatable people/prayer request fields, desktop QR mobile access, and a bottom action bar on phones.

## Launch

Double-click:

```bat
launch-prayer-portal.bat
```

The portal reads `config.json` for the local host, port, and whether to open the browser automatically.

## Configuration

```json
{
  "port": 8787,
  "host": "127.0.0.1",
  "autoOpen": true
}
```

If the port is busy, change `port` and relaunch.

Use `"host": "0.0.0.0"` to make the portal reachable from a phone on the same Wi-Fi. The desktop page shows a QR code for the detected mobile URL.

## Privacy

The XML backup is not copied into this site. The public app database contains generated prayer fragments and a short style summary only. Personal chats, phone numbers, and raw message content are not used by the portal.

## Prayer Style

The generator favors concise, honest prayer: direct requests, simple thanksgiving when appropriate, surrender to God's will, and closing in Jesus' name. This follows the shape of Matthew 6:5-13, Philippians 4:6-7, John 14:13-14, and 1 John 5:14-15.

## Optional AI Generation

The site can call a Cloudflare Worker that uses the Gemini API. The API key must be stored as a Cloudflare secret named `GEMINI_API_KEY`; never put it in `app.js`, `ai-config.js`, or GitHub.

Useful commands:

```bat
npx wrangler login
npm run worker:secret
npm run worker:deploy
```

After deployment, put the Worker `/generate` URL in `ai-config.js`:

```js
window.PRAYER_PORTAL_AI_URL = "https://your-worker.workers.dev/generate";
```

If the Worker is unavailable or the free quota is reached, the app automatically falls back to the static generator.
