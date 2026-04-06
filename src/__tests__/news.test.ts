import { describe, it, expect, vi } from "vitest";

const mockRSSResponse = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Google News</title>
  <item>
    <title><![CDATA[Company X Raises $50M in Series B Funding]]></title>
    <link>https://news.google.com/rss/articles/abc123</link>
    <pubDate>Thu, 03 Apr 2026 10:00:00 GMT</pubDate>
    <source url="https://techcrunch.com">TechCrunch</source>
  </item>
  <item>
    <title>Another Article About Startup Y</title>
    <link>https://news.google.com/rss/articles/def456</link>
    <pubDate>Wed, 02 Apr 2026 08:00:00 GMT</pubDate>
    <source url="https://bloomberg.com">Bloomberg</source>
  </item>
</channel>
</rss>`;

describe("searchGoogleNews", () => {
  it("parses RSS response and prefers source URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockRSSResponse),
    }));

    const { searchGoogleNews } = await import("../lib/news");
    const results = await searchGoogleNews("test query");

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Company X Raises $50M in Series B Funding");
    // Should prefer source URL over Google redirect
    expect(results[0].link).toBe("https://techcrunch.com");
    expect(results[1].link).toBe("https://bloomberg.com");

    vi.unstubAllGlobals();
  });

  it("handles empty RSS response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(`<?xml version="1.0"?><rss><channel></channel></rss>`),
    }));

    const { searchGoogleNews } = await import("../lib/news");
    const results = await searchGoogleNews("empty query");

    expect(results).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it("handles HTTP errors gracefully", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    }));

    const { searchGoogleNews } = await import("../lib/news");
    const results = await searchGoogleNews("error query");

    expect(results).toHaveLength(0);

    vi.unstubAllGlobals();
  });

  it("decodes HTML entities in titles", async () => {
    const rss = `<?xml version="1.0"?>
    <rss><channel>
      <item>
        <title>Company &amp; Co Raises $10M</title>
        <link>https://example.com/1</link>
      </item>
    </channel></rss>`;

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(rss),
    }));

    const { searchGoogleNews } = await import("../lib/news");
    const results = await searchGoogleNews("entities");

    expect(results[0].title).toBe("Company & Co Raises $10M");

    vi.unstubAllGlobals();
  });
});
