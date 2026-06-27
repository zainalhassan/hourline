export function needsOnboarding(
  user: { onboardingCompletedAt: Date | null } | null | undefined,
): boolean {
  return !user?.onboardingCompletedAt;
}
