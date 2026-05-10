// Parse a pasted WhatsApp-style roster and match names against the player list.
// Pure module — no React imports — so it's unit-testable and SSR-safe.

export type RosterMatchResult = {
  matched: string[];                                          // canonical player names to add to selection
  unmatched: string[];                                        // raw input tokens with no match
  ambiguous: { input: string; candidates: string[] }[];       // input → 2+ players
};

const NOISE_WORDS = [
  'game', 'today', 'tomorrow', 'pm', 'am', 'kickoff',
  'ground', 'location', 'time', 'cancelled', 'cancel',
  'pls', 'please',
];

// Strip leading list markers ("1.", "2)", "- ", "* ", "• ", "· ")
const LIST_MARKER = /^\s*(?:\d+[.)\-:]|[-*•·])\s+/;
// Strip trailing parenthetical notes ("(in)", "(maybe)", "(paid)")
const TRAILING_PAREN = /\s*\([^)]*\)\s*$/;
// Keep only letters (incl. extended Latin), whitespace, period, hyphen, apostrophe
const ALLOWED_CHARS = /[^A-Za-zÀ-ſ\s.\-']/g;

function cleanLine(raw: string): string {
  return raw
    .replace(LIST_MARKER, '')
    .replace(TRAILING_PAREN, '')
    .replace(ALLOWED_CHARS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isNoise(s: string): boolean {
  if (!s) return true;
  if (/^\d+$/.test(s)) return true;
  if (/^\d+\s*(pm|am)$/.test(s)) return true;
  if (/^\d+:\d+$/.test(s)) return true;
  let hits = 0;
  for (const w of NOISE_WORDS) if (s.includes(w)) hits++;
  return hits >= 2;
}

export function parseRoster(
  text: string,
  players: { name: string }[],
): RosterMatchResult {
  const indexed = players.map(p => ({
    name: p.name,
    lc: p.name.toLowerCase().trim(),
    first: p.name.toLowerCase().trim().split(/\s+/)[0],
  }));

  const matched = new Set<string>();
  const unmatched: string[] = [];
  const ambiguous: { input: string; candidates: string[] }[] = [];
  const seenInputs = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const cleaned = cleanLine(rawLine);
    if (isNoise(cleaned)) continue;
    if (seenInputs.has(cleaned)) continue;
    seenInputs.add(cleaned);

    // 1. Exact match
    const exact = indexed.filter(p => p.lc === cleaned);
    if (exact.length === 1) {
      matched.add(exact[0].name);
      continue;
    }
    if (exact.length > 1) {
      ambiguous.push({ input: rawLine.trim(), candidates: exact.map(p => p.name) });
      continue;
    }

    // 2. First-token prefix match
    const prefix = indexed.filter(p => p.first === cleaned);
    if (prefix.length === 1) {
      matched.add(prefix[0].name);
      continue;
    }
    if (prefix.length > 1) {
      ambiguous.push({ input: rawLine.trim(), candidates: prefix.map(p => p.name) });
      continue;
    }

    // 3. Substring fallback
    const sub = indexed.filter(p => p.lc.includes(cleaned));
    if (sub.length === 1) {
      matched.add(sub[0].name);
      continue;
    }
    if (sub.length > 1) {
      ambiguous.push({ input: rawLine.trim(), candidates: sub.map(p => p.name) });
      continue;
    }

    unmatched.push(rawLine.trim());
  }

  return {
    matched: [...matched],
    unmatched,
    ambiguous,
  };
}
