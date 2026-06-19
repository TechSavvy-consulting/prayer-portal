const state = {
  db: null,
  lastPrayer: "",
  nonce: 0,
  lastProvider: "static"
};

const elements = {
  form: document.querySelector("#prayer-form"),
  prayerType: document.querySelector("#prayer-type"),
  tone: document.querySelector("#tone"),
  length: document.querySelector("#length"),
  useLocalDatabase: document.querySelector("#use-local-database"),
  peopleRequestList: document.querySelector("#people-request-list"),
  addPersonRequest: document.querySelector("#add-person-request"),
  details: document.querySelector("#details"),
  themeList: document.querySelector("#theme-list"),
  scriptureList: document.querySelector("#scripture-list"),
  output: document.querySelector("#prayer-output"),
  outputTitle: document.querySelector("#output-title"),
  comboCount: document.querySelector("#combo-count"),
  sourceNote: document.querySelector("#source-note"),
  regenerate: document.querySelector("#regenerate"),
  clearForm: document.querySelector("#clear-form"),
  copyPrayer: document.querySelector("#copy-prayer"),
  savePrayer: document.querySelector("#save-prayer"),
  clearFavorites: document.querySelector("#clear-favorites"),
  favoritesList: document.querySelector("#favorites-list"),
  themeToggle: document.querySelector("#theme-toggle"),
  bottomNav: document.querySelector(".bottom-nav"),
  mobileUrl: document.querySelector("#mobile-url"),
  qrImage: document.querySelector("#qr-image")
};

const copyIconMarkup = `
  <svg class="button-icon" aria-hidden="true" viewBox="0 0 24 24">
    <rect x="9" y="9" width="10" height="10" rx="2"></rect>
    <path d="M5 15V7a2 2 0 0 1 2-2h8"></path>
  </svg>
`;

const themeGlyphs = {
  healing: "+",
  wisdom: "W",
  understanding: "?",
  peace: "~",
  protection: "S",
  discernment: "D",
  provision: "$",
  gratitude: "*",
  forgiveness: "F",
  strength: "^",
  joy: "J",
  service: "&",
  faith: "T",
  guidance: ">",
  relationship: "+"
};

const conciseThemeLines = {
  healing: ["Bring healing and restore what is hurting."],
  wisdom: ["Give clear wisdom for the next right step."],
  understanding: ["Bring understanding, patience, and truth."],
  peace: ["Let Your peace guard hearts and minds."],
  protection: ["Protect everyone involved and guide wise choices."],
  discernment: ["Help us know what is from You and what is not."],
  provision: ["Provide what is needed in the right way and time."],
  gratitude: ["Keep our hearts thankful and honest."],
  forgiveness: ["Help us forgive and repair what needs healing."],
  strength: ["Give strength for today."],
  joy: ["Restore simple joy."],
  service: ["Show us how to love and serve well."],
  faith: ["Strengthen faith without fear or striving."],
  guidance: ["Lead us clearly and help us obey."],
  relationship: ["Help this relationship reflect Your love and truth."]
};

const scriptureProfiles = {
  "James 1:5": ["wisdom", "decision", "guidance", "understanding", "discernment"],
  "Philippians 4:6-7": ["peace", "anxiety", "worry", "prayer", "help"],
  "Proverbs 3:5-6": ["trust", "guidance", "decision", "wisdom", "surrender"],
  "Psalm 91": ["protection", "safety", "fear", "travel", "covering"],
  "Psalm 23": ["peace", "comfort", "guidance", "rest", "care"],
  "Isaiah 41:10": ["strength", "fear", "help", "healing", "courage"],
  "Matthew 6:33": ["closer", "priority", "provision", "kingdom", "faith"],
  "Romans 8:28": ["trust", "purpose", "hardship", "hope", "surrender"],
  "2 Timothy 1:7": ["fear", "strength", "courage", "discipline", "peace"],
  "Numbers 6:24-26": ["blessing", "family", "peace", "morning", "protection"],
  "John 14:27": ["peace", "fear", "comfort", "help", "relationship"],
  "Psalm 46:10": ["stillness", "peace", "surrender", "stress", "trust"],
  "Ephesians 3:16-19": ["closer", "faith", "strength", "love", "relationship"],
  "Colossians 3:12-15": ["relationship", "forgiveness", "peace", "family", "love"],
  "1 Corinthians 13:4-7": ["relationship", "love", "patience", "fiance", "marriage"],
  "Psalm 121": ["protection", "travel", "help", "safety", "watching"],
  "Jeremiah 29:11": ["future", "hope", "decision", "plans", "trust"],
  "Lamentations 3:22-23": ["morning", "mercy", "gratitude", "faithfulness", "new day"],
  "Isaiah 26:3": ["peace", "trust", "mind", "anxiety", "focus"],
  "Galatians 5:22-23": ["growth", "spirit", "character", "service", "joy"]
};

const prayerTypeScriptures = {
  morning: ["Lamentations 3:22-23", "Numbers 6:24-26", "Psalm 23"],
  food: ["Matthew 6:33", "Psalm 23", "Galatians 5:22-23"],
  help: ["Philippians 4:6-7", "Isaiah 41:10", "Psalm 46:10"],
  understanding: ["James 1:5", "Proverbs 3:5-6", "Colossians 3:12-15"],
  closer: ["Matthew 6:33", "Ephesians 3:16-19", "Psalm 46:10"],
  healing: ["Isaiah 41:10", "Psalm 23", "Romans 8:28"],
  relationship: ["1 Corinthians 13:4-7", "Colossians 3:12-15", "Ephesians 3:16-19"],
  work: ["James 1:5", "Proverbs 3:5-6", "Matthew 6:33"],
  travel: ["Psalm 121", "Psalm 91", "Numbers 6:24-26"],
  family: ["Colossians 3:12-15", "Numbers 6:24-26", "Psalm 23"],
  decision: ["James 1:5", "Proverbs 3:5-6", "Jeremiah 29:11"],
  protection: ["Psalm 91", "Psalm 121", "Isaiah 41:10"],
  gratitude: ["Lamentations 3:22-23", "Psalm 23", "Galatians 5:22-23"],
  bedtime: ["Psalm 46:10", "John 14:27", "Psalm 91"],
  apology: ["Colossians 3:12-15", "Galatians 5:22-23", "1 Corinthians 13:4-7"],
  community: ["Galatians 5:22-23", "Matthew 6:33", "Colossians 3:12-15"]
};

const bibleBookCodes = {
  James: "JAS",
  Philippians: "PHP",
  Proverbs: "PRO",
  Psalm: "PSA",
  Isaiah: "ISA",
  Matthew: "MAT",
  Romans: "ROM",
  Timothy: "TI",
  Numbers: "NUM",
  John: "JHN",
  Ephesians: "EPH",
  Colossians: "COL",
  Corinthians: "CO",
  Jeremiah: "JER",
  Lamentations: "LAM",
  Galatians: "GAL"
};

function aiEndpoint() {
  if (elements.useLocalDatabase?.checked) return "";
  return String(window.PRAYER_PORTAL_AI_URL || "").trim();
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeRng(seedText) {
  let seed = hashString(seedText) || 1;
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(items, rng) {
  if (!items.length) return "";
  return items[Math.floor(rng() * items.length)];
}

function pickMany(items, count, rng) {
  const copy = [...items];
  const chosen = [];
  while (copy.length && chosen.length < count) {
    const index = Math.floor(rng() * copy.length);
    chosen.push(copy.splice(index, 1)[0]);
  }
  return chosen;
}

function cleanInput(value, fallback) {
  const cleaned = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[<>]/g, "")
    .trim();
  return cleaned || fallback;
}

function sentenceCase(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function fillTemplate(template, values) {
  return template
    .replaceAll("{people}", values.people)
    .replaceAll("{situation}", values.situation)
    .replaceAll("{details}", values.details)
    .replaceAll("{tonePhrase}", values.tonePhrase);
}

function createPersonRequestRow(person = "", request = "") {
  const row = document.createElement("div");
  row.className = "person-request";

  const personId = `person-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const requestId = `request-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  row.innerHTML = `
    <label>
      Person or people
      <input id="${personId}" class="person-input" type="text" placeholder="Mom, my fiance, our family" autocomplete="off">
    </label>
    <label>
      Prayer need or request
      <input id="${requestId}" class="request-input" type="text" placeholder="healing, wisdom, peace, safe travel" autocomplete="off">
    </label>
    <button class="icon-button remove-request" type="button" aria-label="Remove this person or request" title="Remove this person or request">-</button>
  `;

  row.querySelector(".person-input").value = person;
  row.querySelector(".request-input").value = request;
  return row;
}

function renderInitialPersonRequest() {
  elements.peopleRequestList.innerHTML = "";
  elements.peopleRequestList.append(createPersonRequestRow());
  updateRemoveButtons();
}

function updateRemoveButtons() {
  const rows = [...elements.peopleRequestList.querySelectorAll(".person-request")];
  rows.forEach((row) => {
    const button = row.querySelector(".remove-request");
    button.disabled = rows.length === 1;
    button.title = rows.length === 1 ? "Keep at least one request" : "Remove this person or request";
  });
}

function collectPersonRequests() {
  return [...elements.peopleRequestList.querySelectorAll(".person-request")]
    .map((row) => ({
      person: cleanInput(row.querySelector(".person-input")?.value, ""),
      request: cleanInput(row.querySelector(".request-input")?.value, "")
    }))
    .filter((item) => item.person || item.request);
}

function formatPersonRequests(requests) {
  if (!requests.length) return "";
  return requests
    .map((item) => {
      if (item.person && item.request) return `${item.person}: ${item.request}`;
      return item.person || item.request;
    })
    .join("; ");
}

function personRequestPrayerLine(requests) {
  if (!requests.length) return "";
  const lines = requests.map((item) => {
    if (item.person && item.request) return `- ${item.person}: ${item.request}`;
    if (item.person) return `- ${item.person}`;
    return `- ${item.request}`;
  });
  return `Father, I bring these requests to You:\n${lines.join("\n")}`;
}

function detailPrayerLine(details) {
  if (!details) return "";
  return `You know the details: ${details}.`;
}

function honestOpening(type, rng, length) {
  if (length === "tiny" || length === "short") {
    return pick([
      "Father, I come to You honestly.",
      "Lord, I bring this to You.",
      "Jesus, help us with this.",
      "Father, please meet us here.",
      "Lord, guide this need."
    ], rng);
  }
  return pick(type.greetings, rng);
}

function willSurrender(length) {
  if (length === "tiny") return "Let Your will be done. In Jesus name, Amen.";
  if (length === "short") return "Give us wisdom to follow Your will. In Jesus name, Amen.";
  return "";
}

function bibleUrl(reference) {
  const match = reference.match(/^((?:[1-3]\s)?[A-Za-z]+)\s+(\d+)(?::([\d-]+))?$/);
  if (!match) return "https://www.bible.com/";
  const rawBook = match[1];
  const chapter = match[2];
  const verses = match[3]?.replace("-", "-");
  const ordinal = rawBook.match(/^([1-3])\s/);
  const bookName = rawBook.replace(/^[1-3]\s/, "");
  const baseCode = bibleBookCodes[bookName] || bookName.slice(0, 3).toUpperCase();
  const code = ordinal ? `${ordinal[1]}${baseCode}` : baseCode;
  if (!verses) return `https://www.bible.com/bible/111/${code}.${chapter}.NIV`;
  return `https://www.bible.com/bible/111/${code}.${chapter}.${verses}.NIV`;
}

function selectedThemes() {
  return [...elements.themeList.querySelectorAll("input[type='checkbox']:checked")]
    .map((input) => input.value);
}

function selectedThemeLabels() {
  return selectedThemes().map((key) => state.db.themes[key]?.label || key);
}

function scriptureLibrary() {
  return state.db.scriptureReferences.map((reference) => ({
    reference,
    topics: scriptureProfiles[reference] || []
  }));
}

function currentSearchText() {
  const requests = collectPersonRequests()
    .map((item) => `${item.person} ${item.request}`)
    .join(" ");
  return [
    elements.prayerType.value,
    currentPrayerTypeLabel(),
    selectedThemes().join(" "),
    selectedThemeLabels().join(" "),
    requests,
    elements.details.value
  ].join(" ").toLowerCase();
}

function smartScriptureReferences(limit = 6) {
  const selected = new Set(selectedThemes());
  const typeMatches = new Set(prayerTypeScriptures[elements.prayerType.value] || []);
  const searchText = currentSearchText();

  const scored = scriptureLibrary().map((item, index) => {
    let score = 0;
    if (typeMatches.has(item.reference)) score += 4;
    item.topics.forEach((topic) => {
      if (selected.has(topic)) score += 5;
      if (searchText.includes(topic)) score += 2;
    });
    return { ...item, index, score };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter((item, index) => item.score > 0 || index < limit)
    .slice(0, limit)
    .map((item) => item.reference);
}

function renderScriptureReferences(references = smartScriptureReferences()) {
  const allowed = new Set(state.db.scriptureReferences);
  const cleanReferences = [...new Set(references)]
    .filter((reference) => allowed.has(reference))
    .slice(0, 6);
  const finalReferences = cleanReferences.length ? cleanReferences : smartScriptureReferences();

  elements.scriptureList.innerHTML = "";
  finalReferences.forEach((reference) => {
    const link = document.createElement("a");
    link.className = "scripture-link";
    link.href = bibleUrl(reference);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = reference;
    const topics = scriptureProfiles[reference] || [];
    link.title = topics.length
      ? `Open ${reference} on Bible.com - helpful for ${topics.slice(0, 3).join(", ")}`
      : `Open ${reference} on Bible.com`;
    elements.scriptureList.append(link);
  });
}

function lengthSettings(length) {
  if (length === "tiny") return { gratitude: 0, bridge: 0, themeLines: 0, typeFocus: 0, relationship: 0, scripture: 1 };
  if (length === "short") return { gratitude: 0, bridge: 0, themeLines: 1, typeFocus: 0, relationship: 0, scripture: 1 };
  if (length === "long") return { gratitude: 1, bridge: 2, themeLines: 5, typeFocus: 2, relationship: 1, scripture: 2 };
  return { gratitude: 1, bridge: 1, themeLines: 3, typeFocus: 1, relationship: 1, scripture: 1 };
}

function currentFormSeed() {
  const requests = formatPersonRequests(collectPersonRequests());
  return [
    elements.prayerType.value,
    elements.tone.value,
    elements.length.value,
    requests,
    elements.details.value,
    selectedThemes().join(","),
    elements.useLocalDatabase?.checked ? "local" : "ai",
    state.nonce
  ].join("|");
}

function currentPrayerTypeLabel() {
  return state.db.prayerTypes[elements.prayerType.value]?.label || elements.prayerType.value || "Morning Prayer";
}

function currentToneLabel() {
  return state.db.tones[elements.tone.value]?.label || elements.tone.value || "Simple";
}

function aiPayload() {
  return {
    prayerType: currentPrayerTypeLabel(),
    tone: currentToneLabel(),
    length: elements.length.value,
    details: cleanInput(elements.details.value, ""),
    themes: selectedThemeLabels(),
    peopleRequests: collectPersonRequests(),
    scriptureOptions: scriptureLibrary()
  };
}

function buildPrayer() {
  const db = state.db;
  const rng = makeRng(currentFormSeed());
  const type = db.prayerTypes[elements.prayerType.value] || db.prayerTypes.morning;
  const tone = db.tones[elements.tone.value] || db.tones.tender;
  const settings = lengthSettings(elements.length.value);
  const themes = selectedThemes();
  const personRequests = collectPersonRequests();
  const formattedRequests = formatPersonRequests(personRequests);
  const details = cleanInput(elements.details.value, "");
  const values = {
    people: personRequests.map((item) => item.person).filter(Boolean).join(", ") || "the people involved",
    situation: formattedRequests || "this situation",
    details: [formattedRequests, details].filter(Boolean).join("; ") || "every specific detail You already know",
    tonePhrase: pick(tone.phrases, rng)
  };

  const sections = [];
  const themeLines = themes.flatMap((key) => {
    if (elements.length.value === "tiny" || elements.length.value === "short") {
      return conciseThemeLines[key] || db.themes[key]?.lines || [];
    }
    return db.themes[key]?.lines || [];
  });

  sections.push(honestOpening(type, rng, elements.length.value));

  const requestLine = personRequestPrayerLine(personRequests);
  if (requestLine) sections.push(requestLine);
  const detailLine = detailPrayerLine(details);
  if (detailLine) sections.push(detailLine);

  sections.push(...pickMany(db.gratitude, settings.gratitude, rng));
  sections.push(...pickMany(type.focus, settings.typeFocus, rng));
  sections.push(...pickMany(db.bridges, settings.bridge, rng).map((line) => fillTemplate(line, values)));

  if (themeLines.length) {
    sections.push(...pickMany(themeLines, settings.themeLines, rng));
  }

  if (themes.includes("relationship") && settings.relationship) {
    sections.push(...pickMany(db.relationshipBlessings, settings.relationship, rng));
  }

  sections.push(willSurrender(elements.length.value) || pick(db.closings, rng));

  const prayer = sections
    .filter(Boolean)
    .map((line) => sentenceCase(line.trim()))
    .join("\n\n");

  state.lastPrayer = prayer;
  state.lastProvider = "static";
  elements.output.textContent = prayer;
  elements.outputTitle.textContent = type.label;
  elements.sourceNote.textContent = elements.useLocalDatabase?.checked
    ? `${tone.label} tone - Local database`
    : `${tone.label} tone - Static fallback`;
  renderScriptureReferences(smartScriptureReferences());
  return prayer;
}

async function generateAiPrayer() {
  const endpoint = aiEndpoint();
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(aiPayload())
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`AI request failed: ${message.slice(0, 240)}`);
  }

  const data = await response.json();
  if (!data.prayer) throw new Error("AI response did not include a prayer");
  state.lastPrayer = data.prayer;
  state.lastProvider = data.provider || "ai";
  elements.output.textContent = data.prayer;
  elements.outputTitle.textContent = currentPrayerTypeLabel();
  elements.sourceNote.textContent = `${currentToneLabel()} tone - AI generated`;
  renderScriptureReferences(data.scriptureReferences?.length ? data.scriptureReferences : smartScriptureReferences());
  return data.prayer;
}

async function generatePrayer() {
  if (aiEndpoint()) {
    const previousNote = elements.sourceNote.textContent;
    elements.sourceNote.textContent = "Generating with AI...";
    try {
      await generateAiPrayer();
      showPrayerResult();
      return;
    } catch (error) {
      console.warn(error);
      elements.sourceNote.textContent = `${previousNote || "AI unavailable"} · using fallback`;
    }
  }

  buildPrayer();
  showPrayerResult();
}

function showPrayerResult() {
  if (window.matchMedia("(max-width: 980px)").matches) {
    document.querySelector(".daily-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function estimateCombinations(db) {
  const typeCount = Object.values(db.prayerTypes)
    .reduce((total, type) => total + (type.greetings.length * type.focus.length), 0);
  const themeLineCount = Object.values(db.themes)
    .reduce((total, theme) => total + theme.lines.length, 0);
  const rough = typeCount
    * Object.keys(db.tones).length
    * db.invocations.length
    * db.gratitude.length
    * db.bridges.length
    * db.closings.length
    * Math.max(themeLineCount, 1);
  return rough;
}

function formatLargeNumber(value) {
  if (value >= 1_000_000_000) return `${Math.round(value / 1_000_000_000)}B+ combinations`;
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M+ combinations`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K+ combinations`;
  return `${value}+ combinations`;
}

function renderControls() {
  Object.entries(state.db.prayerTypes).forEach(([key, type]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = type.label;
    elements.prayerType.append(option);
  });

  Object.entries(state.db.tones).forEach(([key, tone]) => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = tone.label;
    elements.tone.append(option);
  });

  Object.entries(state.db.themes).forEach(([key, theme], index) => {
    const label = document.createElement("label");
    label.className = "check-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = key;
    input.checked = false;
    const glyph = document.createElement("i");
    glyph.className = "theme-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.textContent = themeGlyphs[key] || "+";
    const text = document.createElement("span");
    text.textContent = theme.label;
    const span = document.createElement("span");
    span.append(glyph, text);
    label.append(input, span);
    elements.themeList.append(label);
  });

  renderScriptureReferences();

  elements.comboCount.textContent = formatLargeNumber(estimateCombinations(state.db));
}

function favoritePreview(prayer) {
  return prayer.replace(/\s+/g, " ").slice(0, 170) + (prayer.length > 170 ? "..." : "");
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem("prayerPortalFavorites") || "[]");
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem("prayerPortalFavorites", JSON.stringify(favorites.slice(0, 30)));
}

function renderFavorites() {
  const favorites = loadFavorites();
  elements.favoritesList.innerHTML = "";

  if (!favorites.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No favorites saved yet.";
    elements.favoritesList.append(empty);
    return;
  }

  favorites.forEach((prayer) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "favorite-item";
    item.textContent = favoritePreview(prayer);
    item.addEventListener("click", () => {
      state.lastPrayer = prayer;
      elements.output.textContent = prayer;
      elements.outputTitle.textContent = "Saved Prayer";
    });
    elements.favoritesList.append(item);
  });
}

function applyStoredTheme() {
  const stored = localStorage.getItem("prayerPortalTheme");
  if (stored === "light") document.body.classList.add("light");
}

async function copyPrayer() {
  if (!state.lastPrayer) return;
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(state.lastPrayer);
  } else {
    const helper = document.createElement("textarea");
    helper.value = state.lastPrayer;
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }
  elements.copyPrayer.textContent = "OK";
  window.setTimeout(() => {
    elements.copyPrayer.innerHTML = copyIconMarkup;
  }, 900);
}

async function loadConnectionInfo() {
  const siteUrl = window.location.href.split("#")[0];
  const host = window.location.hostname;
  const isLocalServer = host === "localhost"
    || host === "127.0.0.1"
    || host.startsWith("192.168.")
    || host.startsWith("10.")
    || /^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(host);

  if (!isLocalServer) {
    elements.mobileUrl.textContent = siteUrl;
    elements.qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(siteUrl)}`;
    return;
  }

  try {
    const response = await fetch("connection.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No local connection info");
    const info = await response.json();
    elements.mobileUrl.textContent = info.mobileUrl || info.localUrl || "Open this site on the same Wi-Fi.";
    elements.qrImage.src = `qr.svg?ts=${Date.now()}`;
  } catch {
    elements.mobileUrl.textContent = siteUrl;
    elements.qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(siteUrl)}`;
  }
}

function saveCurrentPrayer() {
  if (!state.lastPrayer) return;
  const favorites = loadFavorites().filter((item) => item !== state.lastPrayer);
  favorites.unshift(state.lastPrayer);
  saveFavorites(favorites);
  renderFavorites();
  elements.savePrayer.textContent = "*";
  window.setTimeout(() => {
    elements.savePrayer.textContent = "+";
  }, 900);
}

function bindEvents() {
  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    generatePrayer();
  });

  elements.regenerate.addEventListener("click", () => {
    state.nonce += 1;
    generatePrayer();
  });

  elements.clearForm.addEventListener("click", () => {
    elements.form.reset();
    renderInitialPersonRequest();
    [...elements.themeList.querySelectorAll("input")].forEach((input) => {
      input.checked = false;
    });
    state.nonce += 1;
    generatePrayer();
  });

  elements.copyPrayer.addEventListener("click", copyPrayer);
  elements.savePrayer.addEventListener("click", saveCurrentPrayer);

  elements.clearFavorites.addEventListener("click", () => {
    localStorage.removeItem("prayerPortalFavorites");
    renderFavorites();
  });

  elements.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("prayerPortalTheme", document.body.classList.contains("light") ? "light" : "dark");
  });

  elements.addPersonRequest.addEventListener("click", () => {
    elements.peopleRequestList.append(createPersonRequestRow());
    updateRemoveButtons();
  });

  elements.peopleRequestList.addEventListener("click", (event) => {
    const button = event.target.closest(".remove-request");
    if (!button || button.disabled) return;
    button.closest(".person-request")?.remove();
    updateRemoveButtons();
  });

  elements.bottomNav.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-scroll-target]");
    if (!button) return;
    const target = document.querySelector(button.dataset.scrollTarget);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function init() {
  applyStoredTheme();
  const response = await fetch("data/prayer-database.json", { cache: "no-store" });
  state.db = await response.json();
  renderInitialPersonRequest();
  renderControls();
  bindEvents();
  renderFavorites();
  loadConnectionInfo();
  elements.outputTitle.textContent = "Generating prayer";
  elements.output.textContent = "";
  generatePrayer();
}

init().catch((error) => {
  elements.output.textContent = `Could not load the prayer database: ${error.message}`;
});
