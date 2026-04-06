import { describe, it, expect } from "vitest";
import { categorize, computeConfidence, extractDomain } from "../lib/news-categorizer";

describe("categorize", () => {
  it("detects funding news", () => {
    expect(categorize("Company X Raises $50M Series B Round")).toBe("funding");
    expect(categorize("Startup secures seed funding of $5M")).toBe("funding");
    expect(categorize("New investment round led by Sequoia")).toBe("funding");
  });

  it("detects acquisition news", () => {
    expect(categorize("Google Acquires AI Startup for $1B")).toBe("acquisition");
    expect(categorize("Merger between Company A and Company B")).toBe("acquisition");
  });

  it("detects IPO news", () => {
    expect(categorize("Company Files for IPO on Nasdaq")).toBe("ipo");
    expect(categorize("Tech firm goes public on NYSE")).toBe("ipo");
  });

  it("detects launch news", () => {
    expect(categorize("Startup Launches New AI Product")).toBe("launch");
    expect(categorize("Company Unveils Revolutionary Platform")).toBe("launch");
  });

  it("detects award news", () => {
    expect(categorize("CEO Named to Forbes 30 Under 30")).toBe("award");
    expect(categorize("Company Wins Innovation Award")).toBe("award");
  });

  it("detects hire news", () => {
    expect(categorize("Jane Smith Appointed as New CEO")).toBe("hire");
    expect(categorize("Former Google exec joins startup")).toBe("hire");
  });

  it("returns 'other' for unmatched headlines", () => {
    expect(categorize("Company hosts annual conference")).toBe("other");
    expect(categorize("Interview with founder about journey")).toBe("other");
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

  it("increases confidence for reputable domain", () => {
    const score = computeConfidence("Some headline", "Person", null, "techcrunch.com", null);
    expect(score).toBe(0.6);
  });

  it("increases confidence for recent articles", () => {
    const recent = new Date().toISOString();
    const score = computeConfidence("Some headline", "Person", null, null, recent);
    expect(score).toBe(0.6);
  });

  it("caps at 1.0 with all signals", () => {
    const recent = new Date().toISOString();
    const score = computeConfidence(
      "John Doe at Acme Corp raises $50M",
      "John Doe",
      "Acme Corp",
      "techcrunch.com",
      recent
    );
    expect(score).toBeLessThanOrEqual(1.0);
    expect(score).toBeGreaterThanOrEqual(0.89);
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
