const DEFAULT_MODEL = "gemini-2.5-flash-lite";

const STYLE_INSTRUCTIONS = `
You generate short Christian prayers for a prayer portal.

Follow these rules every time:
- Be biblical, simple, honest, and direct.
- Do not flatter God with long decorative language or "butter God up."
- Do not sound generic, theatrical, mystical, or preachy.
- Pray to Father/Lord/Jesus naturally.
- The first sentence must be gratitude to Father, Jesus, or the Holy Spirit.
- Use the provided people and requests as background context, not wording to paste into the prayer.
- Never output a bullet list of people or requests inside the prayer.
- Never write a line like "I bring these requests" followed by names or raw notes.
- Rewrite the situation in your own prayerful words, for example: "Please give Sarah peace and courage as she faces this work decision."
- If multiple people are included, pray over each person in connected sentences or short paragraphs that flow.
- Bring requests to God plainly, ask for wisdom, peace, healing, protection, discernment, or other selected themes when relevant.
- Surrender to God's will.
- Close in Jesus name, Amen.
- Respect the selected length.
- Do not add fake scripture quotes. If scripture references are provided, mention references only when natural.
- Choose 3 to 6 helpful scripture references from the allowed list. Use exact reference text only.
- Return valid JSON only with this shape: {"prayer":"...","scriptureReferences":["..."]}.

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

function cleanList(values, maxItems = 10, maxLength = 120) {
  return Array.isArray(values)
    ? values.map((item) => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function normalizeStyleContext(input = {}) {
  const selectedPrayerTypeTemplate = input.selectedPrayerTypeTemplate || {};
  const selectedToneTemplate = input.selectedToneTemplate || {};
  const selectedThemeTemplates = Array.isArray(input.selectedThemeTemplates)
    ? input.selectedThemeTemplates.slice(0, 12).map((theme) => ({
      key: cleanText(theme.key, 40),
      label: cleanText(theme.label, 60),
      lines: cleanList(theme.lines, 4, 180),
      conciseLines: cleanList(theme.conciseLines, 3, 140)
    })).filter((theme) => theme.label || theme.key)
    : [];

  return {
    sourceStyleNotes: cleanList(input.sourceStyleNotes, 8, 220),
    selectedPrayerTypeTemplate: {
      label: cleanText(selectedPrayerTypeTemplate.label, 80),
      greetings: cleanList(selectedPrayerTypeTemplate.greetings, 5, 180),
      focus: cleanList(selectedPrayerTypeTemplate.focus, 5, 180)
    },
    selectedToneTemplate: {
      label: cleanText(selectedToneTemplate.label, 80),
      phrases: cleanList(selectedToneTemplate.phrases, 6, 120)
    },
    selectedThemeTemplates,
    bridgePatterns: cleanList(input.bridgePatterns, 8, 180),
    gratitudePatterns: cleanList(input.gratitudePatterns, 6, 180),
    closingPatterns: cleanList(input.closingPatterns, 8, 160),
    relationshipBlessings: cleanList(input.relationshipBlessings, 6, 180)
  };
}

function normalizePayload(input) {
  const peopleRequests = Array.isArray(input.peopleRequests)
    ? input.peopleRequests.slice(0, 8).map((item) => ({
      person: cleanText(item.person || item.name, 90),
      request: cleanText(item.request || item.need, 180)
    })).filter((item) => item.person || item.request)
    : [];

  const scriptureOptions = Array.isArray(input.scriptureOptions)
    ? input.scriptureOptions.slice(0, 40).map((item) => ({
      reference: cleanText(item.reference, 40),
      topics: Array.isArray(item.topics) ? item.topics.map((topic) => cleanText(topic, 32)).filter(Boolean).slice(0, 10) : []
    })).filter((item) => item.reference)
    : [];

  return {
    settings: {
      prayerTypeKey: cleanText(input.settings?.prayerTypeKey, 60),
      prayerTypeLabel: cleanText(input.settings?.prayerTypeLabel, 80),
      toneKey: cleanText(input.settings?.toneKey, 60),
      toneLabel: cleanText(input.settings?.toneLabel, 80),
      length: cleanText(input.settings?.length, 20),
      prayOverKeys: cleanList(input.settings?.prayOverKeys, 12, 50),
      prayOverLabels: cleanList(input.settings?.prayOverLabels, 12, 60),
      useLocalDatabase: Boolean(input.settings?.useLocalDatabase)
    },
    prayerType: cleanText(input.prayerType, 80) || "General Prayer",
    tone: cleanText(input.tone, 80) || "Simple",
    length: ["tiny", "short", "medium", "long"].includes(input.length) ? input.length : "short",
    details: cleanText(input.details, 600),
    themes: Array.isArray(input.themes) ? input.themes.map((item) => cleanText(item, 60)).filter(Boolean).slice(0, 12) : [],
    themeKeys: cleanList(input.themeKeys, 12, 50),
    peopleRequests,
    scriptureOptions,
    selectedScriptureReferences: cleanList(input.selectedScriptureReferences, 6, 40),
    styleContext: normalizeStyleContext(input.styleContext),
    previousOutput: cleanText(input.previousOutput, 1200)
  };
}

function userPrompt(payload) {
  const requestSourceNotes = payload.peopleRequests.length
    ? JSON.stringify(payload.peopleRequests)
    : "No specific person/request entered";

  const scriptureOptions = payload.scriptureOptions.length
    ? payload.scriptureOptions.map((item) => `- ${item.reference}: ${item.topics.join(", ")}`).join("\n")
    : "- none";
  const style = payload.styleContext;
  const themeTemplates = style.selectedThemeTemplates.length
    ? style.selectedThemeTemplates.map((theme) => {
      const examples = [...theme.conciseLines, ...theme.lines].slice(0, 4).join(" | ");
      return `- ${theme.label || theme.key}: ${examples}`;
    }).join("\n")
    : "- none selected";
  const requestGuidance = payload.peopleRequests.length
    ? "Understand the people and needs, then rewrite them as smooth prayer sentences. Do not copy the source notes, do not use colon-separated names, and do not repeat the input format."
    : "No specific person was entered; keep the prayer general and heartfelt.";

  return `
Create one prayer with these inputs.

Settings:
- Prayer type: ${payload.settings.prayerTypeLabel || payload.prayerType} (${payload.settings.prayerTypeKey || "unknown key"})
- Tone: ${payload.settings.toneLabel || payload.tone} (${payload.settings.toneKey || "unknown key"})
- Length: ${payload.length}
- Pray over selected: ${payload.settings.prayOverLabels.join(", ") || payload.themes.join(", ") || "none selected"}
- Pray over keys: ${payload.settings.prayOverKeys.join(", ") || payload.themeKeys.join(", ") || "none selected"}
- Local database mode checked: ${payload.settings.useLocalDatabase ? "yes" : "no"}

People and prayer needs as private source notes only. Understand these notes, then write a fresh prayer in your own words:
${requestSourceNotes}
Details: ${payload.details || "none"}

Current/previous prayer output, if present. Use it only to avoid repeating awkward phrasing and to improve flow. Do not imitate any list-like fallback wording:
${payload.previousOutput || "none"}

Style profile from the local database:
Source notes:
${style.sourceStyleNotes.map((note) => `- ${note}`).join("\n") || "- none"}
Prayer type template greetings:
${style.selectedPrayerTypeTemplate.greetings.map((line) => `- ${line}`).join("\n") || "- none"}
Prayer type template focus lines:
${style.selectedPrayerTypeTemplate.focus.map((line) => `- ${line}`).join("\n") || "- none"}
Tone phrases:
${style.selectedToneTemplate.phrases.map((line) => `- ${line}`).join("\n") || "- none"}
Selected Pray Over theme wording:
${themeTemplates}
Bridge patterns:
${style.bridgePatterns.map((line) => `- ${line}`).join("\n") || "- none"}
Gratitude patterns:
${style.gratitudePatterns.map((line) => `- ${line}`).join("\n") || "- none"}
Closing patterns:
${style.closingPatterns.map((line) => `- ${line}`).join("\n") || "- none"}
Relationship blessing patterns:
${style.relationshipBlessings.map((line) => `- ${line}`).join("\n") || "- none"}

Allowed scripture references:
${scriptureOptions}
Preferred scripture references from current settings:
${payload.selectedScriptureReferences.join(", ") || "none"}

Flow instructions:
- Start the first sentence with gratitude to Father, Jesus, or the Holy Spirit.
- ${requestGuidance}
- Keep the prayer in the database style: direct, warm, practical, biblical, and not wordy.
- Use the template examples for style and rhythm, but do not copy a whole template line unless it fits naturally.
- If the selected length is tiny or short, prioritize the people/needs and one clear ask over extra decoration.
- Do not say "You know the details:" unless it sounds natural in the prayer.
- Do not say "Father, I bring these requests to You" or anything that introduces the fields as a list.

Return valid JSON only. The prayer must be plain text with no title, markdown, bullets, or quotation marks inside the prayer string. The scriptureReferences array must contain only exact references from the allowed list.
`;
}

function extractGeminiText(data) {
  return data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim() || "";
}

function parseAiResult(text, payload) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    const prayer = cleanText(parsed.prayer, 5000);
    const allowed = new Set(payload.scriptureOptions.map((item) => item.reference));
    const scriptureReferences = Array.isArray(parsed.scriptureReferences)
      ? parsed.scriptureReferences.map((reference) => cleanText(reference, 40)).filter((reference) => allowed.has(reference)).slice(0, 6)
      : [];
    return { prayer, scriptureReferences };
  } catch {
    return { prayer: cleaned, scriptureReferences: [] };
  }
}

async function generatePrayer(payload, env) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const maxOutputTokens = payload.length === "long" ? 520 : payload.length === "medium" ? 380 : 260;

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
        maxOutputTokens,
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini error ${response.status}: ${message.slice(0, 300)}`);
  }

  const data = await response.json();
  const result = parseAiResult(extractGeminiText(data), payload);
  if (!result.prayer) throw new Error("Gemini returned an empty prayer");
  return result;
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
      if (contentLength > 24000) {
        return jsonResponse({ error: "Request too large" }, 413, origin);
      }

      const payload = normalizePayload(await request.json());
      const result = await generatePrayer(payload, env);
      return jsonResponse({ ...result, provider: "gemini", model: env.GEMINI_MODEL || DEFAULT_MODEL }, 200, origin);
    } catch (error) {
      return jsonResponse({ error: error.message || "Prayer generation failed" }, 500, origin);
    }
  }
};
