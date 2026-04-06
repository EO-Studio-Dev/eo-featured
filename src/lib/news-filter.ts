/**
 * News relevance filter v4 — Score-based post-fetch validation.
 *
 * After fetching articles, each headline gets a relevance score.
 * Only articles above the threshold are kept.
 *
 * Scoring:
 *   Person full name in headline      → +10 (auto-pass)
 *   First + last name both present    → +8
 *   Company name + business context   → +6
 *   Company name in specific source   → +4
 *   Company name alone (unique name)  → +3
 *   Company name alone (generic name) → -5 (likely false positive)
 *   Anti-context detected             → -10 (clearly unrelated)
 *
 * Threshold: >= 3
 */

// ---- Generic name detection ----

const COMMON_WORDS = new Set([
  "speak", "nothing", "world", "merge", "sift", "flare", "series",
  "prepared", "pylon", "sola", "neon", "martin", "linear", "notion",
  "framework", "deel", "granola", "pensive", "tracksuit", "meridian",
  "windsurf", "intercom", "luma", "anza", "bolt", "scale", "pulse",
  "flow", "dash", "snap", "loop", "blend", "drift", "fuse", "glide",
  "harvest", "hive", "ignite", "compass", "atlas", "prism", "canvas",
  "harbor", "beacon", "frontier", "summit", "bridge",
]);

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

// ---- Business context keywords ----

const BUSINESS_CONTEXT = [
  "ceo", "cto", "coo", "cfo", "founder", "co-founder", "cofounder",
  "startup", "funding", "raised", "series", "valuation", "revenue",
  "users", "customers", "platform", "app", "saas", "ai", "launch",
  "product", "company", "enterprise", "growth", "investor", "vc",
  "venture", "capital", "ipo", "acquisition", "acquired", "merger",
  "partnership", "hire", "appoint", "board", "employee", "layoff",
  "unicorn", "billion", "million", "arr", "mrr", "b2b", "b2c",
  "tech", "software", "cloud", "api", "data", "machine learning",
  "automation", "robotics", "crypto", "blockchain", "fintech",
  "marketplace", "ecommerce", "logistics",
];

// Known tech/business news sources
const TECH_SOURCES = new Set([
  "techcrunch", "bloomberg", "reuters", "forbes", "fortune",
  "cnbc", "venturebeat", "the verge", "wired", "axios",
  "the information", "business insider", "businessinsider.com",
  "saastr", "crunchbase", "pitchbook", "yahoo finance",
  "the next web", "ars technica", "pcmag", "fast company",
  "inc.com", "entrepreneur", "business wire", "pr newswire",
  "analytics insight", "pulse 2.0",
]);

// ---- Anti-context: signals the article is NOT about the company ----

const ANTI_PATTERNS = [
  // "speak" as verb
  /\bwill speak\b/i, /\bto speak\b/i, /\bspeaks? at\b/i,
  /\bspeak out\b/i, /\bspeak during\b/i, /\bspeaker\b/i,
  /\bspoke at\b/i, /\bspeak from\b/i, /\bspoken\b/i,
  // "nothing" as pronoun
  /\bnothing to\b/i, /\bnothing but\b/i, /\bnothing like\b/i,
  /\bfor nothing\b/i, /\bhas nothing\b/i, /\bdoes nothing\b/i,
  /\bmean nothing\b/i, /\bnothing wrong\b/i, /\bnothing new\b/i,
  // "framework" as concept
  /\bframework for\b/i, /\bregulatory framework\b/i,
  /\blegal framework\b/i, /\bpolicy framework\b/i,
  // "linear" as adjective
  /\blinear regression\b/i, /\blinear algebra\b/i, /\bnon-linear\b/i,
  // "world" as common noun
  /\baround the world\b/i, /\bworld cup\b/i, /\bworld war\b/i,
  /\bworld record\b/i, /\bin the world\b/i, /\bworld series\b/i,
  // "merge" as verb
  /\bmerge with\b/i, /\bmerge into\b/i, /\bmerge lanes\b/i,
  // General non-business
  /\b(sports?|weather|recipe|horoscope|cricket|football|basketball|soccer|nfl|nba|mlb)\b/i,
  /\b(election|obituary|died at|passed away|tv show|movie review|box office)\b/i,
  /\b(white house|congress|senate|parliament|supreme court|presidential)\b/i,
  /\b(gabby petito|trump|biden|taylor swift|kardashian)\b/i,
  /\b(police|arrested|murder|crime scene|domestic violence|shooting)\b/i,
  /\b(real estate listing|property for sale|home prices)\b/i,
  /\b(astronaut|nasa|space station|lunar)\b/i,
];

// ---- Scoring function ----

function scoreRelevance(
  headline: string,
  personName: string,
  companyName: string | null,
  sourceDomain: string | null,
): number {
  const lower = headline.toLowerCase();
  let score = 0;

  // Anti-context check first (strong negative signal)
  if (ANTI_PATTERNS.some(p => p.test(headline))) {
    score -= 10;
  }

  // Person name matching
  const personLower = personName.toLowerCase();
  const nameParts = personLower.split(/\s+/).filter(p => p.length > 1);

  if (lower.includes(personLower)) {
    // Full name match — very strong
    score += 10;
  } else if (nameParts.length >= 2 && nameParts.every(p => lower.includes(p))) {
    // All name parts present
    score += 8;
  }

  // Company name matching
  if (companyName) {
    const companyLower = companyName.toLowerCase();
    const generic = isGenericName(companyName);

    if (lower.includes(companyLower)) {
      if (generic) {
        // Generic name match — could be false positive
        // Only count it if business context is present
        const hasBizContext = BUSINESS_CONTEXT.some(kw => lower.includes(kw));
        score += hasBizContext ? 4 : -5;
      } else {
        // Specific company name — good signal
        score += 5;
      }
    }
  }

  // Business context boost
  const bizKeywordCount = BUSINESS_CONTEXT.filter(kw => lower.includes(kw)).length;
  if (bizKeywordCount >= 2) score += 2;

  // Tech source boost
  if (sourceDomain && TECH_SOURCES.has(sourceDomain.toLowerCase())) {
    score += 2;
  }

  return score;
}

const RELEVANCE_THRESHOLD = 3;

/**
 * Check if a headline is relevant to the person/company.
 * Uses score-based validation after fetching.
 */
export function isHeadlineRelevant(
  headline: string,
  personName: string,
  companyName: string | null,
  sourceDomain?: string | null,
): boolean {
  const score = scoreRelevance(headline, personName, companyName, sourceDomain || null);
  return score >= RELEVANCE_THRESHOLD;
}
