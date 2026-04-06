/**
 * News relevance filter v5 — Context-aware scoring.
 *
 * Key insight: when a company name is a common English word (e.g., "Speak"),
 * we check if the word is used AS the company name or as a regular word.
 *
 * Signals that it's used as a company name:
 * - Capitalized at non-sentence-start position ("...at Speak, the language...")
 * - Followed by business context ("Speak raises", "Speak CEO", "Speak app")
 * - Person name also appears in the headline
 *
 * Signals that it's used as a regular word:
 * - Used as a verb ("to speak", "will speak", "speaks at")
 * - Used as a common noun ("nothing to do", "the framework for")
 * - No business context nearby
 */

// ---- Common English words that are also company names ----
// This list is comprehensive — covers verbs, nouns, adjectives
const COMMON_WORDS = new Set([
  // From our DB + known problematic words
  "speak", "nothing", "world", "merge", "sift", "flare", "series",
  "prepared", "pylon", "sola", "neon", "martin", "linear", "notion",
  "framework", "deel", "granola", "pensive", "tracksuit", "meridian",
  "windsurf", "intercom", "luma", "anza", "bolt", "scale", "pulse",
  "flow", "dash", "snap", "loop", "blend", "drift", "fuse", "glide",
  "harvest", "hive", "ignite", "compass", "atlas", "prism", "canvas",
  "harbor", "beacon", "frontier", "summit", "bridge", "fountain",
  "whisper", "anchor", "forge", "craft", "cipher", "cascade", "ember",
]);

// Known non-company entries
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

// Business context words — if these appear near the company name, it's likely about the company
const BUSINESS_WORDS = new Set([
  "ceo", "cto", "coo", "cfo", "founder", "cofounder", "co-founder",
  "startup", "funding", "raised", "raises", "valuation", "revenue",
  "users", "customers", "platform", "app", "saas", "launch", "launched",
  "product", "company", "enterprise", "growth", "investor", "vc",
  "venture", "capital", "ipo", "acquisition", "acquired", "merger",
  "partnership", "hire", "hired", "appoint", "appointed", "board",
  "layoff", "unicorn", "billion", "million", "arr", "mrr",
  "tech", "software", "cloud", "api", "ai", "data",
  "automation", "robotics", "crypto", "blockchain", "fintech",
  "marketplace", "ecommerce", "series a", "series b", "series c",
  "seed", "round", "backed", "investment",
]);

// Tech/business news sources
const TECH_SOURCES = new Set([
  "techcrunch", "bloomberg", "bloomberg.com", "reuters", "forbes", "fortune",
  "cnbc", "venturebeat", "the verge", "wired", "axios",
  "the information", "business insider", "businessinsider.com",
  "saastr", "crunchbase", "pitchbook", "yahoo finance",
  "the next web", "ars technica", "pcmag", "fast company",
  "inc.com", "entrepreneur", "business wire", "pr newswire",
  "analytics insight", "pulse 2.0", "the rundown ai",
]);

// ---- Helper functions ----

function isGenericName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (NOT_COMPANIES.has(lower)) return true;
  if (!lower.includes(" ") && COMMON_WORDS.has(lower)) return true;
  if (!lower.includes(" ") && lower.length <= 3) return true;
  if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(name) && !lower.includes("ai") && !lower.includes("lab")) return true;
  return false;
}

export function shouldSkipCompany(companyName: string | null): boolean {
  if (!companyName) return false;
  return NOT_COMPANIES.has(companyName.toLowerCase().trim());
}

export function buildSearchQueries(personName: string, companyName: string | null): string[] {
  const queries = [`"${personName}"`];
  if (companyName && !shouldSkipCompany(companyName) && !isGenericName(companyName)) {
    queries.push(`"${companyName}"`);
  }
  return queries;
}

// ---- Context analysis for generic company names ----

/**
 * Check if a generic company name is used AS the company name (not as a regular word).
 * Returns true if it looks like it refers to the company.
 */
function isUsedAsCompanyName(headline: string, companyName: string): boolean {
  const lower = headline.toLowerCase();
  const companyLower = companyName.toLowerCase();

  // Check if the word appears with business context nearby (within ~50 chars)
  const idx = lower.indexOf(companyLower);
  if (idx === -1) return false;

  // Get surrounding context (50 chars before and after)
  const start = Math.max(0, idx - 50);
  const end = Math.min(lower.length, idx + companyLower.length + 50);
  const context = lower.slice(start, end);

  // Business context nearby → likely company name
  for (const bw of BUSINESS_WORDS) {
    if (context.includes(bw)) return true;
  }

  // Check if it's capitalized in the original headline (non-sentence-start)
  // Find the word in original headline
  const origIdx = headline.toLowerCase().indexOf(companyLower);
  if (origIdx > 0) {
    const charBefore = headline[origIdx - 1];
    const isCapitalized = headline[origIdx] === headline[origIdx].toUpperCase();
    // Capitalized after a space (not sentence start) → likely proper noun / company
    if (charBefore === " " && isCapitalized) {
      // But check it's not after a period (sentence start)
      const textBefore = headline.slice(Math.max(0, origIdx - 3), origIdx).trim();
      if (!textBefore.endsWith(".") && !textBefore.endsWith("!") && !textBefore.endsWith("?")) {
        return true;
      }
    }
  }

  return false;
}

// ---- Main scoring function ----

function scoreRelevance(
  headline: string,
  personName: string,
  companyName: string | null,
  sourceDomain: string | null,
): number {
  const lower = headline.toLowerCase();
  let score = 0;

  // ---- Person name matching ----
  const personLower = personName.toLowerCase();
  const nameParts = personLower.split(/\s+/).filter(p => p.length > 1);

  if (lower.includes(personLower)) {
    score += 10; // Full name match
  } else if (nameParts.length >= 2 && nameParts.every(p => lower.includes(p))) {
    score += 8; // All name parts present
  }

  // ---- Company name matching ----
  if (companyName) {
    const companyLower = companyName.toLowerCase();
    const generic = isGenericName(companyName);

    if (lower.includes(companyLower)) {
      if (generic) {
        // Generic name — check context to see if it's used as the company name
        if (isUsedAsCompanyName(headline, companyName)) {
          score += 5; // Used as company name with business context
        } else {
          score -= 8; // Used as regular English word — strong negative
        }
      } else {
        score += 5; // Specific company name — good signal
      }
    }
  }

  // ---- Source quality ----
  if (sourceDomain && TECH_SOURCES.has(sourceDomain.toLowerCase())) {
    score += 2;
  }

  // ---- Topic blockers (strong negative) ----
  const blockPatterns = [
    /\b(sports?|weather|recipe|horoscope|cricket|football|basketball|soccer|nfl|nba|mlb)\b/i,
    /\b(election|obituary|died at|passed away|tv show|movie review|box office)\b/i,
    /\b(white house|congress|senate|parliament|supreme court|presidential)\b/i,
    /\b(gabby petito|trump|biden|taylor swift|kardashian)\b/i,
    /\b(police|arrested|murder|crime scene|domestic violence|shooting)\b/i,
    /\b(real estate listing|property for sale|home prices)\b/i,
    /\b(astronaut|nasa|space station|lunar mission)\b/i,
    /\b(ice cream|flavors?|ingredients?|cooking)\b/i,
    /\b(horse racing|stakes|derby|jockey)\b/i,
  ];
  if (blockPatterns.some(p => p.test(headline))) {
    score -= 10;
  }

  return score;
}

// Blocked news sources — low quality or irrelevant aggregators
const BLOCKED_SOURCES = new Set([
  "msn.com", "africa.businessinsider.com", "news.google.com",
  "yahoo.com", "aol.com",
]);

const RELEVANCE_THRESHOLD = 3;

/**
 * Check if a headline is relevant to the person/company.
 */
export function isHeadlineRelevant(
  headline: string,
  personName: string,
  companyName: string | null,
  sourceDomain?: string | null,
): boolean {
  // Block low-quality sources
  if (sourceDomain && BLOCKED_SOURCES.has(sourceDomain.toLowerCase())) return false;

  return scoreRelevance(headline, personName, companyName, sourceDomain || null) >= RELEVANCE_THRESHOLD;
}
