import { describe, expect, it } from "vitest";
import { getDefaultFieldConfig } from "@/lib/timesheet/presets";
import {
  formatPdfColumnValue,
  getPdfDisplayColumns,
  getPdfShiftBreakdown,
} from "@/lib/timesheet/pdfColumns";

describe("pdf columns", () => {
  const careConfig = getDefaultFieldConfig("FIELD_ENGINEER");

  it("orders shift type before customer and pairs customer with notes", () => {
    const columns = getPdfDisplayColumns(careConfig);

    expect(columns[0]?.id).toBe("shift_type");
    expect(columns[0]?.label).toBe("Shift type");
    expect(columns[1]?.id).toBe("client_notes");
    expect(columns[1]?.label).toBe("Customer / Notes");
    expect(columns.some((c) => c.id === "mileage_mileageDescription")).toBe(true);
    expect(columns.some((c) => c.id === "notes")).toBe(false);
  });

  it("formats paired customer and notes in one cell", () => {
    const columns = getPdfDisplayColumns(careConfig);
    const customerColumn = columns.find((c) => c.id === "client_notes")!;

    const value = formatPdfColumnValue(
      {
        durationMinutes: 60,
        mileage: null,
        metadata: {
          client: "Jane Doe",
          notes: "Medication reminder",
        },
      },
      customerColumn,
    );

    expect(value).toBe("Jane Doe\nMedication reminder");
  });

  it("formats shift type from custom metadata", () => {
    const columns = getPdfDisplayColumns(careConfig);
    const shiftColumn = columns.find((c) => c.id === "shift_type")!;

    const value = formatPdfColumnValue(
      {
        durationMinutes: 60,
        mileage: null,
        metadata: { shift_type: "Morning" },
      },
      shiftColumn,
    );

    expect(value).toBe("Morning");
  });

  it("summarises shift counts in option order", () => {
    const breakdown = getPdfShiftBreakdown(
      [
        {
          durationMinutes: 60,
          mileage: null,
          metadata: { shift_type: "Morning" },
        },
        {
          durationMinutes: 45,
          mileage: null,
          metadata: { shift_type: "Lunch" },
        },
        {
          durationMinutes: 30,
          mileage: null,
          metadata: { shift_type: "Morning" },
        },
      ],
      careConfig,
    );

    expect(breakdown).toBe("Morning (2) · Lunch (1)");
  });
});
