import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { getAppDisplayName } from "@/lib/env";
import { TIMESHEET_FIELDS, type TemplateFieldConfig } from "@/lib/timesheet/fields";
import { formatDuration } from "@/lib/timesheet/periods";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#555",
    marginBottom: 2,
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#1BD974",
    color: "#fff",
    padding: 6,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    padding: 6,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    padding: 6,
    backgroundColor: "#f9fafb",
  },
  colDate: { width: "12%" },
  colDuration: { width: "10%" },
  colField: { width: "19.5%" },
  totals: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#1BD974",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
});

type PdfEntry = {
  entryDate: Date;
  durationMinutes: number;
  mileage: number | null;
  metadata: Record<string, unknown>;
};

type PdfInput = {
  userName: string;
  userEmail: string;
  periodStart: Date;
  periodEnd: Date;
  templateName: string;
  fields: TemplateFieldConfig[];
  entries: PdfEntry[];
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getFieldValue(entry: PdfEntry, fieldKey: string): string {
  if (fieldKey === "durationMinutes") return formatDuration(entry.durationMinutes);
  if (fieldKey === "mileage") return entry.mileage != null ? String(entry.mileage) : "—";
  if (fieldKey === "billable") {
    return entry.metadata.billable ? "Yes" : "No";
  }
  const value = entry.metadata[fieldKey];
  return value != null && String(value).trim() ? String(value) : "—";
}

function TimesheetDocument({
  input,
  generatedAt,
}: {
  input: PdfInput;
  generatedAt: string;
}) {
  const visibleFields = input.fields
    .filter((f) => f.visible && f.fieldKey !== "durationMinutes" && f.fieldKey !== "mileage")
    .slice(0, 3);

  const totalMinutes = input.entries.reduce((sum, e) => sum + e.durationMinutes, 0);
  const totalMileage = input.entries.reduce((sum, e) => sum + (e.mileage ?? 0), 0);
  const appName = getAppDisplayName();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Timesheet</Text>
          <Text style={styles.subtitle}>{input.userName}</Text>
          <Text style={styles.subtitle}>{input.userEmail}</Text>
          <Text style={styles.subtitle}>
            Period: {formatDate(input.periodStart)} – {formatDate(input.periodEnd)}
          </Text>
          <Text style={styles.subtitle}>Template: {input.templateName}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDuration}>Hours</Text>
            {visibleFields.map((f) => (
              <Text key={f.fieldKey} style={styles.colField}>
                {TIMESHEET_FIELDS[f.fieldKey].label}
              </Text>
            ))}
            <Text style={styles.colField}>Mileage</Text>
          </View>
          {input.entries.map((entry, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colDate}>{formatDate(entry.entryDate)}</Text>
              <Text style={styles.colDuration}>{formatDuration(entry.durationMinutes)}</Text>
              {visibleFields.map((f) => (
                <Text key={f.fieldKey} style={styles.colField}>
                  {getFieldValue(entry, f.fieldKey)}
                </Text>
              ))}
              <Text style={styles.colField}>
                {entry.mileage != null ? String(entry.mileage) : "—"}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <Text>Total hours: {formatDuration(totalMinutes)}</Text>
          {totalMileage > 0 && <Text>Total mileage: {totalMileage.toFixed(1)} miles</Text>}
        </View>

        <Text style={styles.footer} fixed>
          Generated with {appName} · {generatedAt} · {input.userEmail}
        </Text>
      </Page>
    </Document>
  );
}

export async function generateTimesheetPdf(input: PdfInput): Promise<Buffer> {
  const generatedAt = new Date().toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const doc = (
    <TimesheetDocument input={input} generatedAt={generatedAt} />
  );

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
