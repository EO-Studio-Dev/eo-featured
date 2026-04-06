import type { NewsCategory } from "@/types/supabase";

/**
 * Category classification v3 — Action-based analysis.
 *
 * Instead of scanning for keywords anywhere, we identify the PRIMARY ACTION
 * of the headline and categorize based on that.
 *
 * Key principle: "Allbirds is selling for $39M. It raised 10x that in its IPO"
 * → Main action: "is selling" → M&A (not IPO, even though "IPO" appears)
 *
 * Strategy:
 * 1. Check for PRIMARY action patterns (verb phrases that indicate the main news)
 * 2. Check for NEGATIVE patterns (past references, subordinate clauses)
 * 3. First matching primary action wins
 */

interface CategoryRule {
  category: NewsCategory;
  // Primary action patterns — these indicate the headline IS ABOUT this category
  primary: RegExp[];
  // Negative patterns — if matched, this category should NOT apply even if primary matches
  exclude: RegExp[];
}

const RULES: CategoryRule[] = [
  // ---- M&A ----
  // Main actions: selling, being acquired, bought, merged
  {
    category: "acquisition",
    primary: [
      /\b(is |are )?selling (for|to|itself)\b/i,
      /\bsold (for|to)\b/i,
      /\bbeing (acquired|bought|sold)\b/i,
      /\b(acquires?|acquired)\b(?!.*talent)/i,  // "acquires" but not "acquires talent" (that's hire)
      /\b(agrees?|agreed) to (buy|acquire|sell)\b/i,
      /\b(buys?|bought|buying)\b(?!.*ticket|.*home|.*car)/i, // not buying consumer goods
      /\btakeover\b/i,
      /\bmerger\b/i,
      /\bmerges? with\b/i,
      /\btaken private\b/i,
      /\bdeal to (buy|acquire|sell)\b/i,
      /\b(sells?|selling) (its|the|a) .*\b(business|unit|division|company|stake)\b/i,
      /\bpurchase[sd]? (by|for)\b/i,
    ],
    exclude: [],
  },

  // ---- IPO ----
  // Main actions: filing for IPO, going public, listing
  // Exclude: past IPO references ("since its IPO", "in its IPO", "after IPO")
  {
    category: "ipo",
    primary: [
      /\bfiles? (for|to go) (ipo|public)\b/i,
      /\bplans? (to go|an?) ipo\b/i,
      /\bgoes public\b/i,
      /\bgoing public\b/i,
      /\bipo (filing|planned|expected|imminent|set)\b/i,
      /\bprices? (its|the) ipo\b/i,
      /\b(debuts?|listed?) on (nasdaq|nyse|stock exchange)\b/i,
      /\bspac (merger|deal)\b/i,
      /\bdirect listing\b/i,
    ],
    exclude: [
      /\b(since|after|before|in) (its|the|their) ipo\b/i,
      /\braised .* (in|during|at) (its|the) ipo\b/i,
      /\bipo (was|had|has been)\b/i,
      /\bpost-ipo\b/i,
    ],
  },

  // ---- Funding ----
  // Main actions: raising money, closing rounds, securing investment
  // Exclude: past funding references ("had raised", "previously raised")
  {
    category: "funding",
    primary: [
      /\braises? \$[\d.]+[bmk]?\b/i,
      /\braised \$[\d.]+[bmk]?\b/i,
      /\bsecures? \$[\d.]+[bmk]?\b/i,
      /\bcloses? \$[\d.]+[bmk]?\b/i,
      /\b\$[\d.]+[bmk]? (round|funding|investment|raise)\b/i,
      /\b(series [a-f]|seed) (round|funding)\b/i,
      /\bfundrais(e[sd]?|ing)\b/i,
      /\b(pre-seed|seed round)\b/i,
      /\bround led by\b/i,
      /\bvaluation (hits?|reaches?|soars?|climbs?|at|of)\b/i,
      /\b(venture|vc) (funding|backed|investment)\b/i,
      /\bunicorn status\b/i,
      /\bsignals investor confidence\b/i,
    ],
    exclude: [
      /\braised .* (in|during|at) (its|the) ipo\b/i, // raised during IPO = not funding round
      /\bhad (previously )?raised\b/i,
      /\b(it|which|that|who) raised .* (ago|before|earlier|previously)\b/i,
    ],
  },

  // ---- Launch ----
  {
    category: "launch",
    primary: [
      /\blaunch(es|ed|ing)? (a |an |its |new |the )/i,
      /\bunveils? (a |an |its |new |the )/i,
      /\bdebuts? (a |an |its |new |the )/i,
      /\brolls? out (a |an |its |new |the )/i,
      /\bintroduc(es|ed|ing) (a |an |its |new |the )/i,
      /\breleases? (a |an |its |new |the )/i,
      /\bnew (product|feature|platform|tool|service|version)\b/i,
      /\bopen[- ]sources?\b/i,
    ],
    exclude: [],
  },

  // ---- Award ----
  {
    category: "award",
    primary: [
      /\b(wins?|won) (a |an |the ).*award\b/i,
      /\bnamed to .* (list|award|ranking)\b/i,
      /\brecognized (as|for|by)\b/i,
      /\b(top|best) \d+ .*(startup|compan|founder|innovator)/i,
      /\bforbes .*(list|30|under)\b/i,
    ],
    exclude: [],
  },

  // ---- Hire/Leadership ----
  {
    category: "hire",
    primary: [
      /\b(joins?|joined) (as|the)\b/i,
      /\bappointed? (as )?(new )?(ceo|cto|coo|cfo|president|chief|head|vp)\b/i,
      /\bnamed (new )?(ceo|cto|coo|cfo|president|chief|head)\b/i,
      /\bsteps? down (as|from)\b/i,
      /\bresigns? (as|from)\b/i,
      /\b(ceo|cto|coo|cfo) (departs?|exits?|leaves?)\b/i,
    ],
    exclude: [],
  },
];

export function categorize(headline: string): NewsCategory {
  for (const rule of RULES) {
    // Check if any primary pattern matches
    const hasPrimary = rule.primary.some(p => p.test(headline));
    if (!hasPrimary) continue;

    // Check if any exclusion pattern matches
    const hasExclusion = rule.exclude.some(p => p.test(headline));
    if (hasExclusion) continue;

    return rule.category;
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
