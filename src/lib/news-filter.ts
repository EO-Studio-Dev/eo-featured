/**
 * Generic company name filter.
 *
 * Some company names are common English words (e.g., "Speak", "Nothing", "World").
 * When searching news for these companies, unrelated articles flood in.
 *
 * Rules:
 * 1. GENERIC_NAMES: Company names that are common words — require person name in headline
 * 2. AMBIGUOUS_NAMES: Names that could match other contexts — require company context
 * 3. BLOCKED_PATTERNS: Headlines that are clearly irrelevant
 */

// Common English words that are also company names
const GENERIC_NAMES = new Set([
  "speak", "nothing", "world", "merge", "sift", "flare", "series",
  "prepared", "pylon", "sola", "neon", "martin", "linear",
  "framework", "deel", "granola", "pensive", "tracksuit",
  "intercom", "meridian", "windsurf",
]);

// Names that need extra context (person name or specific keyword)
const AMBIGUOUS_NAMES = new Set([
  "1x", "ema unlimited", "luma ai", "radical ai",
  "twelve labs", "relay.app", "rocket.new",
]);

// Headlines containing these patterns are likely irrelevant
const BLOCKED_HEADLINE_PATTERNS = [
  /\bsports?\b/i,
  /\bweather\b/i,
  /\brecipe\b/i,
  /\bhoroscope\b/i,
  /\bcricket\b/i,
  /\bfootball\b/i,
  /\bbasketball\b/i,
  /\bsoccer\b/i,
  /\bpolitics\b/i,
  /\belection\b/i,
  /\bcelebrity\b/i,
  /\bmovie review\b/i,
  /\btv show\b/i,
  /\bdied\b/i,
  /\bobituary\b/i,
];

export function isCompanyNameGeneric(companyName: string): boolean {
  return GENERIC_NAMES.has(companyName.toLowerCase()) ||
         AMBIGUOUS_NAMES.has(companyName.toLowerCase());
}

/**
 * Check if a headline is relevant to the person/company.
 * Returns true if the article should be kept, false if it should be filtered out.
 */
export function isHeadlineRelevant(
  headline: string,
  personName: string,
  companyName: string | null,
): boolean {
  const lower = headline.toLowerCase();

  // Block obviously irrelevant patterns
  if (BLOCKED_HEADLINE_PATTERNS.some((p) => p.test(headline))) {
    return false;
  }

  // If company name is generic, headline MUST contain the person's name
  if (companyName && isCompanyNameGeneric(companyName)) {
    const personParts = personName.toLowerCase().split(/\s+/);
    const lastName = personParts[personParts.length - 1];
    // At minimum, the last name should appear in the headline
    if (!lower.includes(lastName) && !lower.includes(personName.toLowerCase())) {
      return false;
    }
  }

  // Headline should contain at least the person's last name OR the company name
  const personParts = personName.toLowerCase().split(/\s+/);
  const lastName = personParts[personParts.length - 1];
  const hasPersonRef = lower.includes(lastName) || lower.includes(personName.toLowerCase());
  const hasCompanyRef = companyName ? lower.includes(companyName.toLowerCase()) : false;

  if (!hasPersonRef && !hasCompanyRef) {
    return false;
  }

  return true;
}

/**
 * Build search query with appropriate specificity based on company name.
 */
export function buildSearchQuery(personName: string, companyName: string | null): string {
  if (!companyName) {
    return `"${personName}"`;
  }

  if (isCompanyNameGeneric(companyName)) {
    // For generic names, always search with person name to avoid noise
    return `"${personName}" "${companyName}"`;
  }

  // Normal: search for either
  return companyName
    ? `"${personName}" "${companyName}"`
    : `"${personName}"`;
}
