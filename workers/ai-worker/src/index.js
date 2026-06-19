const DEFAULT_MODEL = "gemini-2.5-flash-lite";

const STYLE_INSTRUCTIONS = `
You generate short Christian prayers for a prayer portal.

Follow these rules every time:
- Be biblical, simple, honest, and direct.
- Do not flatter God with long decorative language or "butter God up."
- Do not sound generic, theatrical, mystical, or preachy.
- Pray to Father/Lord/Jesus naturally.
- Include the provided people and requests in context, not as raw notes.
- Bring requests to God plainly, ask for wisdom, peace, healing, protection, discernment, or other selected themes when relevant.
- Surrender to God's will.
- Close in Jesus name, Amen.
- Respect the selected length.
- Do not add fake scripture quotes. If scripture references are provided, mention references only when natural.

Length targets:
- tiny: 25-45 words.
- short: 40-70 words.
- medium: 80-130 words.
- long: 140-220 words.

The style should feel like a sincere couple praying in daily life: warm, faithful, clear, and practical.
`;

function jsonResponse(body, status = 200, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      ...securityHeaders()
    }
  });
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Cache-Control": "no-store"
  };
}

function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function allowedOrigin(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!origin) return "*";
  if (allowed.includes(origin)) return origin;
  if (/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) return origin;
  return "";
}

function cleanText(value, maxLength = 500) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizePayload(input) {
  const peopleRequests = Array.isArray(input.peopleRequests)
    ? input.peopleRequests.slice(0, 8).map((item) => ({
      person: cleanText(item.person, 90),
      request: cleanText(item.request, 180)
    })).filter((item) => item.person || item.request)
    : [];

  return {
    prayerType: cleanText(input.prayerType, 80) || "Morning Prayer",
    tone: cleanText(input.tone, 80) || "Simple",
    length: ["tiny", "short", "medium", "long"].includes(input.length) ? input.length : "short",
    details: cleanText(input.details, 600),
    themes: Array.isArray(input.themes) ? input.themes.map((item) => cleanText(item, 60)).filter(Boolean).slice(0, 12) : [],
    peopleRequests
  };
}

function userPrompt(payload) {
  const requests = payload.peopleRequests.length
    ? payload.peopleRequests.map((item) => {
      if (item.person && item.request) return `- ${item.person}: ${item.request}`;
      return `- ${item.person || item.request}`;
    }).join("\n")
    : "- no specific person/request entered";

  return `
Create one prayer with these inputs.

Prayer type: ${payload.prayerType}
Tone: ${payload.tone}
Length: ${payload.length}
Pray over themes: ${payload.themes.join(", ") || "none selected"}
People and requests:
${requests}
Details: ${payload.details || "none"}

Return only the prayer text. No title, explanation, bullets, markdown, or quotation marks.
`;
}

function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim() || "";
}

async function generatePrayer(payload, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const maxOutputTokens = payload.length === "long" ? 320 : payload.length === "medium" ? 220 : 120;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: STYLE_INSTRUCTIONS }]
      },
      contents: [{
        role: "user",
        parts: [{ text: userPrompt(payload) }]
      }],
      generationConfig: {
        temperature: 0.55,
        topP: 0.9,
        maxOutputTokens
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini error ${response.status}: ${message.slice(0, 300)}`);
  }

  const data = await response.json();
  const prayer = extractGeminiText(data);
  if (!prayer) throw new Error("Gemini returned an empty prayer");
  return prayer;
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(request, env);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: origin ? 204 : 403,
        headers: {
          ...corsHeaders(origin || "null"),
          ...securityHeaders()
        }
      });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Use POST /generate" }, 405, origin || "null");
    }

    if (url.pathname !== "/generate") {
      return jsonResponse({ error: "Not found" }, 404, origin || "null");
    }

    if (!origin) {
      return jsonResponse({ error: "Origin not allowed" }, 403, "null");
    }

    try {
      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        return jsonResponse({ error: "Content-Type must be application/json" }, 415, origin);
      }

      const contentLength = Number(request.headers.get("Content-Length") || "0");
      if (contentLength > 12000) {
        return jsonResponse({ error: "Request too large" }, 413, origin);
      }

      const payload = normalizePayload(await request.json());
      const prayer = await generatePrayer(payload, env);
      return jsonResponse({ prayer, provider: "gemini", model: env.GEMINI_MODEL || DEFAULT_MODEL }, 200, origin);
    } catch (error) {
      return jsonResponse({ error: error.message || "Prayer generation failed" }, 500, origin);
    }
  }
};
