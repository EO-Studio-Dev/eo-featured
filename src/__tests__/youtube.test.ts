import { describe, it, expect } from "vitest";
import { parseVideoTitle, makeSlug } from "../lib/youtube";

describe("parseVideoTitle", () => {
  it("parses 'Title | Company, Person Name' pattern", () => {
    const result = parseVideoTitle("35M Users. $100M ARR. | Otter.ai, Sam Liang");
    expect(result.personName).toBe("Sam Liang");
    expect(result.companyName).toBe("Otter.ai");
  });

  it("parses 'Title | Company, Role, Person Name' pattern", () => {
    const result = parseVideoTitle("Interview | Acme Corp, CEO, John Doe");
    expect(result.personName).toBe("John Doe");
    expect(result.companyName).toBe("Acme Corp");
    expect(result.role).toBe("CEO");
  });

  it("parses 'Title | Person Name' pattern (no company)", () => {
    const result = parseVideoTitle("Great Talk | Jane Smith");
    expect(result.personName).toBe("Jane Smith");
    expect(result.companyName).toBeNull();
  });

  it("returns nulls when no pipe separator", () => {
    const result = parseVideoTitle("Just a random title without separator");
    expect(result.personName).toBeNull();
    expect(result.companyName).toBeNull();
  });

  it("decodes HTML entities", () => {
    const result = parseVideoTitle("He&#39;s the CEO | Acme, John O&#39;Brien");
    expect(result.personName).toBe("John O'Brien");
  });

  it("handles &quot; entities", () => {
    const result = parseVideoTitle("&quot;50 AI Agents&quot; | Gumloop, Max Brodeur-Urbas");
    expect(result.personName).toBe("Max Brodeur-Urbas");
    expect(result.companyName).toBe("Gumloop");
  });
});

describe("makeSlug", () => {
  it("creates a slug with a random hash suffix", () => {
    const slug = makeSlug("Sam Liang");
    expect(slug).toMatch(/^sam-liang-[a-z0-9]{4}$/);
  });

  it("handles Korean characters", () => {
    const slug = makeSlug("이승건");
    expect(slug).toMatch(/^이승건-[a-z0-9]{4}$/);
  });

  it("generates unique slugs", () => {
    const slug1 = makeSlug("Test Name");
    const slug2 = makeSlug("Test Name");
    expect(slug1).not.toBe(slug2);
  });
});
