import { describe, it, expect } from "vitest";
import { isHeadlineRelevant, shouldSkipCompany, buildSearchQueries } from "../lib/news-filter";

describe("isHeadlineRelevant", () => {
  it("accepts headlines with full person name", () => {
    expect(isHeadlineRelevant("Sam Liang launches new product", "Sam Liang", "Otter.ai")).toBe(true);
  });

  it("accepts headlines with company name in business context", () => {
    expect(isHeadlineRelevant("Otter.ai raises $50M Series C", "Sam Liang", "Otter.ai")).toBe(true);
  });

  it("rejects 'speak' used as verb", () => {
    expect(isHeadlineRelevant("Parents to speak in Boise on domestic violence", "Connor Zwick", "Speak")).toBe(false);
  });

  it("rejects 'nothing' used as pronoun", () => {
    expect(isHeadlineRelevant("There is nothing to worry about in the market", "Carl Pei", "Nothing")).toBe(false);
  });

  it("accepts generic company name with business context", () => {
    expect(isHeadlineRelevant("Neon raises $50M to scale serverless Postgres", "Nikita Shamgunov", "Neon", "TechCrunch")).toBe(true);
  });

  it("rejects blocked topics", () => {
    expect(isHeadlineRelevant("White House discusses new policy framework", "Person", "Company")).toBe(false);
    expect(isHeadlineRelevant("Football player arrested after shooting", "Person", "Company")).toBe(false);
  });

  it("rejects non-credible sources", () => {
    expect(isHeadlineRelevant("Great article about startup", "Person", "Company", "msn.com")).toBe(false);
    expect(isHeadlineRelevant("Great article about startup", "Person", "Company", "dailymail.co.uk")).toBe(false);
  });

  it("accepts credible sources", () => {
    expect(isHeadlineRelevant("Person launches new startup", "Person", "Startup", "TechCrunch")).toBe(true);
  });
});

describe("shouldSkipCompany", () => {
  it("skips non-company entries", () => {
    expect(shouldSkipCompany("Lucy Guo")).toBe(true);
    expect(shouldSkipCompany("Carnegie Mellon University")).toBe(true);
    expect(shouldSkipCompany("Harvard Business School")).toBe(true);
  });

  it("does not skip real companies", () => {
    expect(shouldSkipCompany("Perplexity AI")).toBe(false);
    expect(shouldSkipCompany("Gumloop")).toBe(false);
    expect(shouldSkipCompany("Otter.ai")).toBe(false);
  });
});

describe("buildSearchQueries", () => {
  it("returns person name query for generic company", () => {
    const queries = buildSearchQueries("Carl Pei", "Nothing");
    expect(queries).toEqual(['"Carl Pei"']);
  });

  it("returns both queries for specific company", () => {
    const queries = buildSearchQueries("Sam Liang", "Otter.ai");
    expect(queries).toEqual(['"Sam Liang"', '"Otter.ai"']);
  });

  it("returns only person name when no company", () => {
    const queries = buildSearchQueries("John Doe", null);
    expect(queries).toEqual(['"John Doe"']);
  });
});
