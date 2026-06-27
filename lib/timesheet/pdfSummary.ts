import {
  getVisibleResolvedFields,
  normalizeFieldConfig,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { formatDuration } from "@/lib/timesheet/periods";

export type PdfSummaryEntry = {
  durationMinutes: number;
  mileage: number | null;
  metadata: Record<string, unknown>;
};

export type PdfSummaryMetric = {
  label: string;
  value: string;
};

function fieldIsVisible(
  config: StoredFieldConfig,
  fieldKey: "mileage" | "billable",
): boolean {
  return getVisibleResolvedFields(config).some(
    (field) => field.kind === "builtIn" && field.fieldKey === fieldKey,
  );
}

function isBillableEntry(entry: PdfSummaryEntry): boolean {
  return entry.metadata.billable === true || entry.metadata.billable === "true";
}

export function getPdfSummaryMetrics(
  entries: PdfSummaryEntry[],
  fieldConfig: StoredFieldConfig,
): PdfSummaryMetric[] {
  const config = normalizeFieldConfig(fieldConfig);
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
  const metrics: PdfSummaryMetric[] = [
    {
      label: "Total hours",
      value: formatDuration(totalMinutes),
    },
  ];

  if (fieldIsVisible(config, "mileage")) {
    const totalMileage = entries.reduce(
      (sum, entry) => sum + (entry.mileage ?? 0),
      0,
    );
    metrics.push({
      label: "Total mileage",
      value: `${totalMileage.toFixed(1)} miles`,
    });
  }

  if (fieldIsVisible(config, "billable")) {
    const billableMinutes = entries
      .filter(isBillableEntry)
      .reduce((sum, entry) => sum + entry.durationMinutes, 0);
    metrics.push({
      label: "Billable hours",
      value: formatDuration(billableMinutes),
    });
  }

  return metrics;
}
