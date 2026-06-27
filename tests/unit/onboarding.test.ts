import { describe, expect, it } from "vitest";
import { needsOnboarding } from "@/lib/onboarding";

describe("onboarding", () => {
  it("requires onboarding when completion timestamp is missing", () => {
    expect(needsOnboarding({ onboardingCompletedAt: null })).toBe(true);
    expect(needsOnboarding(undefined)).toBe(true);
  });

  it("skips onboarding when completion timestamp exists", () => {
    expect(
      needsOnboarding({ onboardingCompletedAt: new Date("2026-01-01") }),
    ).toBe(false);
  });
});
