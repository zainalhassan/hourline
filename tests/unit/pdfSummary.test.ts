import { describe, expect, it } from "vitest";
import { getDefaultFieldConfig } from "@/lib/timesheet/presets";
import { getPdfSummaryMetrics } from "@/lib/timesheet/pdfSummary";

describe("pdf summary metrics", () => {
  const entries = [
    {
      durationMinutes: 120,
      mileage: 25.5,
      metadata: { billable: true },
    },
    {
      durationMinutes: 60,
      mileage: 10,
      metadata: { billable: false },
    },
  ];

  it("includes hours and mileage for care support worker templates", () => {
    const metrics = getPdfSummaryMetrics(
      entries,
      getDefaultFieldConfig("FIELD_ENGINEER"),
    );
    expect(metrics).toEqual([
      { label: "Total hours", value: "3h" },
      { label: "Total mileage", value: "35.5 miles" },
    ]);
  });

  it("includes billable hours for consultant templates", () => {
    const metrics = getPdfSummaryMetrics(
      entries,
      getDefaultFieldConfig("CONSULTANT"),
    );
    expect(metrics).toEqual([
      { label: "Total hours", value: "3h" },
      { label: "Billable hours", value: "2h" },
    ]);
  });

  it("shows only total hours for office desk templates", () => {
    const metrics = getPdfSummaryMetrics(
      entries,
      getDefaultFieldConfig("OFFICE_DESK"),
    );
    expect(metrics).toEqual([{ label: "Total hours", value: "3h" }]);
  });
});
