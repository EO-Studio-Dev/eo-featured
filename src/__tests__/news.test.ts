import { describe, it, expect, vi } from "vitest";

// Mock fetch for Google News RSS tests
const mockRSSResponse = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Google News</title>
  <item>
    <title><![CDATA[Company X Raises $50M in Series B Funding]]></title>
    <link>https://techcrunch.com/article/company-x-funding</link>
    <pubDate>Thu, 03 Apr 2026 10:00:00 GMT</pubDate>
    <source url="https://techcrunch.com">TechCrunch</source>
  </item>
  <item>
    <title>Another Article About Startup Y</title>
    <link>https://bloomberg.com/news/startup-y</link>
    <pubDate>Wed, 02 Apr 2026 08:00:00 GMT</pubDate>
    <source url="https://bloomberg.com">Bloomberg</source>
  </item>
</channel>
</rss>`;

describe("searchGoogleNews", () => {
  it("parses RSS response correctly", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockRSSResponse),
    }));

    const { searchGoogleNews } = await import("../lib/news");
    const results = await searchGoogleNews("test query");

    expect(results).toHaveLength(2);
    expect(results[0].title).toBe("Company X Raises $50M in Series B Funding");
    expect(results[0].link).toBe("https://techcrunch.com/article/company-x-funding");
    expect(results[0].pubDate).toBe("Thu, 03 Apr 2026 10:00:00 GMT");
    expect(results[1].title).toBe("Another Article About Startup Y");

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
