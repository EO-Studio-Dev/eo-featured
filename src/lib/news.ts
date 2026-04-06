export interface RawNewsResult {
  title: string;
  link: string;
  pubDate: string | null;
  source: string | null;
  ogImageUrl: string | null;
}

/**
 * Search news via Google News RSS.
 * Links are Google redirects — we extract the source domain from <source> tag.
 */
export async function searchGoogleNews(query: string): Promise<RawNewsResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en&gl=US&ceid=US:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; EOFeatured/1.0)" },
  });

  if (!res.ok) {
    console.error(`Google News RSS error: ${res.status}`);
    return [];
  }

  const xml = await res.text();
  return parseRSS(xml);
}

function parseRSS(xml: string): RawNewsResult[] {
  const results: RawNewsResult[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const title = extractTag(item, "title");
    const link = extractTag(item, "link");
    const pubDate = extractTag(item, "pubDate");
    const source = extractTag(item, "source");
    // Extract source URL from <source url="..."> attribute
    const sourceUrlMatch = item.match(/<source\s+url=["']([^"']+)["']/i);
    const sourceUrl = sourceUrlMatch ? sourceUrlMatch[1] : null;

    if (title && link) {
      results.push({
        title: decodeEntities(title),
        link: sourceUrl || link,  // Prefer real source URL over Google redirect
        pubDate,
        source,
        ogImageUrl: null,
      });
    }
  }

  return results;
}

/**
 * Fetch OG image from an actual article URL (not Google News redirect).
 */
export async function fetchOGImage(url: string): Promise<string | null> {
  // Skip Google News URLs
  if (url.includes("news.google.com")) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (!ogMatch) return null;

    const imgUrl = ogMatch[1];
    // Skip generic Google/placeholder images
    if (imgUrl.includes("gstatic.com") || imgUrl.length < 20) return null;

    return imgUrl;
  } catch {
    return null;
  }
}

/**
 * Resolve a Google News RSS URL by following the redirect to get the real article URL.
 * Google News RSS links use protobuf-encoded tokens. We use a HEAD request with redirect follow.
 */
export async function resolveRealUrl(googleNewsUrl: string): Promise<string | null> {
  if (!googleNewsUrl.includes("news.google.com")) return googleNewsUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Fetch the Google News redirect page — it contains a JS redirect with the real URL
    const res = await fetch(googleNewsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      signal: controller.signal,
      redirect: "manual", // Don't follow, check Location header
    });
    clearTimeout(timeout);

    // Check for Location header redirect
    const location = res.headers.get("location");
    if (location && !location.includes("news.google.com")) {
      return location;
    }

    // Try parsing HTML for meta refresh or JS redirect
    const html = await res.text();
    const metaRefresh = html.match(/url=["']?(https?:\/\/[^"'\s>]+)/i);
    if (metaRefresh) return metaRefresh[1];

    const jsRedirect = html.match(/window\.location\s*=\s*["'](https?:\/\/[^"']+)/i);
    if (jsRedirect) return jsRedirect[1];

    // Try data-url attribute
    const dataUrl = html.match(/data-url=["'](https?:\/\/[^"']+)/i);
    if (dataUrl) return dataUrl[1];

    return null;
  } catch {
    return null;
  }
}

function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`);
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`);
  const m = xml.match(regex);
  return m ? m[1].trim() : null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
