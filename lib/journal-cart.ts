export type JournalPlan = "PRINT" | "ONLINE" | "PRINT_ONLINE";

export function getIssueCountFromFrequency(frequency: string | null | undefined): number {
  if (!frequency) return 2;
  const cleaned = frequency.trim().toLowerCase();

  if (cleaned.includes("bi-annual") || cleaned.includes("biannual")) return 2;

  const match = cleaned.match(/^(\d+)/);
  if (match) {
    const parsed = parseInt(match[1], 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }

  return 2;
}

export function getIssueLabels(totalIssues: number): string[] {
  if (totalIssues === 2) {
    return ["Issue 1 (Jan-Jun)", "Issue 2 (Jul-Dec)"];
  }
  if (totalIssues === 3) {
    return ["Issue 1 (Jan-Apr)", "Issue 2 (May-Aug)", "Issue 3 (Sep-Dec)"];
  }
  if (totalIssues === 4) {
    return ["Issue 1 (Jan-Mar)", "Issue 2 (Apr-Jun)", "Issue 3 (Jul-Sep)", "Issue 4 (Oct-Dec)"];
  }
  if (totalIssues === 6) {
    return [
      "Issue 1 (Jan-Feb)",
      "Issue 2 (Mar-Apr)",
      "Issue 3 (May-Jun)",
      "Issue 4 (Jul-Aug)",
      "Issue 5 (Sep-Oct)",
      "Issue 6 (Nov-Dec)"
    ];
  }
  if (totalIssues === 12) {
    return [
      "Issue 1 (Jan)",
      "Issue 2 (Feb)",
      "Issue 3 (Mar)",
      "Issue 4 (Apr)",
      "Issue 5 (May)",
      "Issue 6 (Jun)",
      "Issue 7 (Jul)",
      "Issue 8 (Aug)",
      "Issue 9 (Sep)",
      "Issue 10 (Oct)",
      "Issue 11 (Nov)",
      "Issue 12 (Dec)"
    ];
  }

  return Array.from({ length: totalIssues }, (_, i) => `Issue ${i + 1}`);
}

export function getCurrentSubscriptionYears(): number[] {
  return [2026, 2025, 2024];
}

export function buildJournalCartItemId(
  slug: string,
  plan: JournalPlan,
  year: string,
  issue: string | null | undefined
): string {
  return `${slug}-${plan}-${year}-${issue || "all"}`;
}

export function getIssueWiseUnitPrice(
  annualPrice: number,
  totalIssues: number,
  issue: string | null | undefined
): number {
  if (!issue || issue === "All(Jan-Dec)") return annualPrice;
  return Math.max(1, Math.round(annualPrice / Math.max(1, totalIssues)));
}
