/**
 * News relevance filter v3.
 *
 * Three-layer defense against irrelevant news:
 * 1. Company name analysis — auto-detect generic/common English words
 * 2. Headline relevance scoring — require strong person/company match
 * 3. Blocked patterns — obvious non-tech/non-business topics
 */

// ---- Layer 1: Generic company name detection ----

// Single common English words (verbs, nouns, adjectives)
const COMMON_ENGLISH_WORDS = new Set([
  // Verbs
  "speak", "merge", "sift", "flare", "launch", "prepared", "relay",
  "bolt", "notion", "scale", "pulse", "flow", "dash", "snap", "loop",
  "blend", "drift", "fuse", "glide", "harvest", "hive", "ignite",
  // Nouns
  "nothing", "world", "series", "pylon", "neon", "framework", "deel",
  "granola", "pensive", "tracksuit", "meridian", "windsurf", "intercom",
  "linear", "sola", "flare", "martin", "compass", "atlas", "prism",
  "canvas", "harbor", "beacon", "frontier", "summit", "bridge",
  // Common names that are also company names
  "anza", "luma",
]);

// Known non-company entries (person names stored as companies, universities, etc.)
const NOT_COMPANIES = new Set([
  "lucy guo", "godard abel", "nirav patel", "joshua browder",
  "rebecca lynn", "dan uyemura", "will bryk", "benjamin mann",
  "andrew beebe", "paul bragiel", "gaurav misra", "glen wise",
  "john kim", "john whaley", "sadi khan", "pelu tran", "ron gutman",
  "raza habib", "yuhki yamashita", "martin",
  "carnegie mellon university", "caltech", "harvard business school",
  "stanford university", "stanford china researcher",
  "crush-it conference", "his challenge",
  "ex-meta cto & gigascale founder", "instagram co-founder & anthropic cpo",
  "co-founder of snowflake", "snowflake cfo", "captain of seoul robotics",
]);

/**
 * Auto-detect if a company name is too generic to search for.
 * Checks: is it a single common English word? Is it too short?
 */
function isGenericName(name: string): boolean {
  const lower = name.toLowerCase().trim();

  // Known non-companies
  if (NOT_COMPANIES.has(lower)) return true;

  // Single word that's a common English word
  if (!lower.includes(" ") && COMMON_ENGLISH_WORDS.has(lower)) return true;

  // Very short single words (1-3 chars) are almost always too generic
  if (!lower.includes(" ") && lower.length <= 3) return true;

  // Names that are just a person's name pattern (First Last)
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name) && !lower.includes("ai") && !lower.includes("lab")) return true;

  return false;
}

/**
 * Should we skip news collection for this company entirely?
 */
export function shouldSkipCompany(companyName: string | null): boolean {
  if (!companyName) return false;
  return isGenericName(companyName);
}

/**
 * Build search queries — returns multiple queries to run.
 * One for person, one for company (if non-generic).
 */
export function buildSearchQueries(personName: string, companyName: string | null): string[] {
  const queries = [`"${personName}"`];
  if (companyName && !shouldSkipCompany(companyName)) {
    queries.push(`"${companyName}"`);
  }
  return queries;
}

// ---- Layer 2: Headline relevance ----

/**
 * Check if a headline is actually about the person/company.
 */
export function isHeadlineRelevant(
  headline: string,
  personName: string,
  companyName: string | null,
): boolean {
  const lower = headline.toLowerCase();

  // ---- Layer 3: Block irrelevant topics ----
  const blockPatterns = [
    /\b(sports?|weather|recipe|horoscope|cricket|football|basketball|soccer|nfl|nba|mlb)\b/i,
    /\b(election|obituary|died at|passed away|tv show|movie review|box office)\b/i,
    /\b(white house|congress|senate|parliament|supreme court|presidential)\b/i,
    /\b(gabby petito|trump|biden|taylor swift|kardashian)\b/i,
    /\b(police|arrested|murder|crime scene|domestic violence)\b/i,
    /\b(real estate listing|property for sale|home prices)\b/i,
    /\bwill speak at\b/i,
    /\bspeak out\b/i,
    /\bspeak during\b/i,
    /\bto speak\b/i,
    /\bspeaks? at\b/i,
    /\bspeaker for\b/i,
    /\bspeak from\b/i,
  ];
  if (blockPatterns.some((p) => p.test(headline))) return false;

  // ---- Person name check ----
  const personLower = personName.toLowerCase();
  const nameParts = personLower.split(/\s+/).filter(p => p.length > 1);

  // Full name match is strongest signal
  if (lower.includes(personLower)) return true;

  // First + last name both present (in any order)
  if (nameParts.length >= 2) {
    const allPartsPresent = nameParts.every(part => lower.includes(part));
    if (allPartsPresent) return true;
  }

  // ---- Company name check (only for non-generic names) ----
  if (companyName && !isGenericName(companyName)) {
    const companyLower = companyName.toLowerCase();
    // Use word boundary for short company names to avoid partial matches
    if (companyLower.length < 6) {
      const escaped = companyLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(headline)) return true;
    } else {
      if (lower.includes(companyLower)) return true;
    }
  }

  // Nothing matched → reject
  return false;
}
