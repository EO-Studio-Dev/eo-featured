import { describe, it, expect } from "vitest";
import { categorize, computeConfidence, extractDomain } from "../lib/news-categorizer";

describe("categorize", () => {
  it("detects funding news", () => {
    expect(categorize("Perplexity AI Raises $500M at $9B Valuation")).toBe("funding");
    expect(categorize("Startup secures $50M in Series B funding")).toBe("funding");
    expect(categorize("Company closes $10M seed round led by Sequoia")).toBe("funding");
  });

  it("detects acquisition/M&A news", () => {
    expect(categorize("Google Acquires AI Startup for $1B")).toBe("acquisition");
    expect(categorize("Allbirds is selling for $39M")).toBe("acquisition");
    expect(categorize("Company X bought by Microsoft")).toBe("acquisition");
    expect(categorize("Startup sells its AI division to Meta")).toBe("acquisition");
  });

  it("detects IPO news", () => {
    expect(categorize("Stripe Files for IPO on NYSE")).toBe("ipo");
    expect(categorize("Tech firm goes public on Nasdaq")).toBe("ipo");
  });

  it("detects launch news", () => {
    expect(categorize("Startup Launches a New AI Product")).toBe("launch");
    expect(categorize("Company unveils its latest platform")).toBe("launch");
    expect(categorize("Gumloop rolls out a new enterprise feature")).toBe("launch");
  });

  it("detects award news", () => {
    expect(categorize("CEO Named to Forbes 30 Under 30 list")).toBe("award");
    expect(categorize("Company wins a prestigious innovation award")).toBe("award");
  });

  it("detects hire news", () => {
    expect(categorize("Jane Smith appointed as new CEO")).toBe("hire");
    expect(categorize("CTO steps down from role")).toBe("hire");
  });

  it("returns 'other' for unmatched headlines", () => {
    expect(categorize("Company hosts annual conference")).toBe("other");
    expect(categorize("Interview with founder about journey")).toBe("other");
  });

  it("prioritizes M&A over funding when both mentioned", () => {
    expect(categorize("Allbirds is selling for $39M. It raised nearly 10 times that amount in its IPO")).toBe("acquisition");
  });

  it("excludes past IPO references from IPO category", () => {
    expect(categorize("Since its IPO, the stock has dropped 80%")).toBe("other");
    expect(categorize("Company raised $100M in its IPO last year")).toBe("other");
  });
});

describe("computeConfidence", () => {
  it("returns base confidence of 0.5 with no matches", () => {
    const score = computeConfidence("Random headline", "Unknown Person", null, null, null);
    expect(score).toBe(0.5);
  });

  it("increases confidence for person name match", () => {
    const score = computeConfidence("John Doe raises funding", "John Doe", null, null, null);
    expect(score).toBe(0.6);
  });

  it("increases confidence for company name match", () => {
    const score = computeConfidence("Acme Corp launches product", "Jane", "Acme Corp", null, null);
    expect(score).toBe(0.6);
  });

  it("increases confidence for recent articles", () => {
    const recent = new Date().toISOString();
    const score = computeConfidence("Some headline", "Person", null, null, recent);
    expect(score).toBe(0.6);
  });

  it("caps at 1.0", () => {
    const recent = new Date().toISOString();
    const score = computeConfidence(
      "John Doe at Acme Corp raises $50M",
      "John Doe", "Acme Corp", null, recent
    );
    expect(score).toBeLessThanOrEqual(1.0);
    expect(score).toBeGreaterThanOrEqual(0.7);
  });
});

describe("extractDomain", () => {
  it("extracts domain from URL", () => {
    expect(extractDomain("https://www.techcrunch.com/article/123")).toBe("techcrunch.com");
    expect(extractDomain("https://bloomberg.com/news/story")).toBe("bloomberg.com");
  });

  it("strips www prefix", () => {
    expect(extractDomain("https://www.reuters.com/article")).toBe("reuters.com");
  });

  it("returns null for invalid URL", () => {
    expect(extractDomain("not a url")).toBeNull();
  });
});
