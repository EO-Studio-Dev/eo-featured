import type { NewsCategory } from "@/types/supabase";

/**
 * Category rules — checked in order, first match wins.
 * M&A (acquisition) is checked BEFORE funding to avoid misclassification.
 *
 * M&A: company sold, bought, merged, or acquired by another entity
 * Funding: company raised money from investors (VC, seed, series rounds)
 */
const CATEGORY_RULES: { category: NewsCategory; patterns: RegExp[] }[] = [
  // M&A — must be checked before funding (some acquisitions mention dollar amounts)
  {
    category: "acquisition",
    patterns: [
      /\bacquir(e[sd]?|ing)\b/i,
      /\bacquisition\b/i,
      /\bmerger?\b/i,
      /\b(buys|bought|buying)\b/i,
      /\btakeover\b/i,
      /\bdeal to buy\b/i,
      /\bpurchase[sd]?\b/i,
      /\bsold to\b/i,
      /\bsells? (itself|to|its)\b/i,
      /\bbought by\b/i,
      /\btaken over\b/i,
      /\btaken private\b/i,
    ],
  },
  // IPO — check before funding (IPO is a specific exit event)
  {
    category: "ipo",
    patterns: [
      /\bipo\b/i,
      /\bpublic offering\b/i,
      /\bnasdaq\b/i,
      /\bnyse\b/i,
      /\bgoes public\b/i,
      /\bgoing public\b/i,
      /\bstock exchange\b/i,
      /\bspac\b/i,
      /\bdirect listing\b/i,
      /\bfiles? (for|to) (go|list)\b/i,
    ],
  },
  // Funding — money raised from investors
  {
    category: "funding",
    patterns: [
      /\braised?\b/i,
      /\bfundrais/i,
      /\bfunding\b/i,
      /\bseries [a-f]\b/i,
      /\bseed round\b/i,
      /\bpre-seed\b/i,
      /\bround led by\b/i,
      /\bsecures? .*\b(million|billion|funding|round)\b/i,
      /\bcloses? .*\b(round|funding|million|billion)\b/i,
      /\b(venture|vc) (capital|funding|backed)\b/i,
      /\bunicorn\b/i,
      /\bvaluation\b/i,
      /\b\$\d+[mb]\b.*\b(round|funding|investment)\b/i,
    ],
  },
  // Launch — new product, feature, or company milestone
  {
    category: "launch",
    patterns: [
      /\blaunch(es|ed|ing)?\b/i,
      /\bunveils?\b/i,
      /\bdebuts?\b/i,
      /\brolls? out\b/i,
      /\bopen[- ]source[sd]?\b/i,
      /\bnew (product|feature|platform|tool|service)\b/i,
      /\breleases? (new|its|a)\b/i,
      /\bintroduc(es|ed|ing)\b/i,
    ],
  },
  // Award/Recognition
  {
    category: "award",
    patterns: [
      /\baward/i,
      /\bwinner\b/i,
      /\brecognized\b/i,
      /\bnamed to\b/i,
      /\bforbes.*(list|30|under)\b/i,
      /\b(top|best) \d+\b/i,
      /\bhonor(ed)?\b/i,
    ],
  },
  // Hire/Leadership changes
  {
    category: "hire",
    patterns: [
      /\bjoins? (as|the)\b/i,
      /\bappointed? (as|new)?\b/i,
      /\bnamed (new )?(ceo|cto|coo|cfo|president|chief)\b/i,
      /\bhires?\b/i,
      /\bsteps? down\b/i,
      /\bresigns?\b/i,
      /\bnew (ceo|cto|coo|cfo|chief|head)\b/i,
    ],
  },
];

export function categorize(headline: string): NewsCategory {
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(headline))) {
      return rule.category;
    }
  }
  return "other";
}

export function computeConfidence(
  headline: string,
  personName: string,
  companyName: string | null,
  sourceDomain: string | null,
  publishedAt: string | null
): number {
  let score = 0.5;
  if (headline.toLowerCase().includes(personName.toLowerCase())) score += 0.1;
  if (companyName && headline.toLowerCase().includes(companyName.toLowerCase())) score += 0.1;
  if (publishedAt) {
    const daysAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo <= 90) score += 0.1;
  }
  return Math.min(score, 1.0);
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return null;
  }
}
