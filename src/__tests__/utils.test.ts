import { describe, it, expect } from "vitest";
import { cn, getInitials, getAvatarColor, formatNumber } from "../lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("getInitials", () => {
  it("returns first character", () => {
    expect(getInitials("Sam Liang")).toBe("S");
    expect(getInitials("이승건")).toBe("이");
  });
});

describe("getAvatarColor", () => {
  it("returns a bg-neutral color class", () => {
    const color = getAvatarColor("Test Name");
    expect(color).toMatch(/^bg-neutral-\d+$/);
  });

  it("returns consistent colors for same name", () => {
    expect(getAvatarColor("John")).toBe(getAvatarColor("John"));
  });
});

describe("formatNumber", () => {
  it("formats billions", () => {
    expect(formatNumber(2_400_000_000)).toBe("$2.4B");
  });

  it("formats millions", () => {
    expect(formatNumber(50_000_000)).toBe("$50M");
  });

  it("formats thousands", () => {
    expect(formatNumber(5_000)).toBe("5K");
  });

  it("returns plain number for small values", () => {
    expect(formatNumber(42)).toBe("42");
  });
});
