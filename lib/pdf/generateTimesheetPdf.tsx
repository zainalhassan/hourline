import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { getAppDisplayName } from "@/lib/env";
import {
  formatPdfColumnValue,
  getPdfDisplayColumns,
  getPdfShiftBreakdown,
} from "@/lib/timesheet/pdfColumns";
import { normalizeFieldConfig, type StoredFieldConfig } from "@/lib/timesheet/fieldConfig";
import { formatDuration } from "@/lib/timesheet/periods";
import { getPdfSummaryMetrics } from "@/lib/timesheet/pdfSummary";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555", marginBottom: 2 },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ecfdf3",
    borderWidth: 1,
    borderColor: "#1BD974",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 8,
    color: "#166534",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  shiftBreakdown: {
    marginTop: 6,
    fontSize: 9,
    color: "#444",
  },
  table: { marginTop: 12 },
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
  colDate: { width: "14%" },
  colDuration: { width: "12%" },
  colDynamic: { flex: 1 },
  colPaired: { flex: 1.4 },
  cellMultiline: { lineHeight: 1.35 },
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
  fieldConfig: StoredFieldConfig;
  entries: PdfEntry[];
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function TimesheetDocument({
  input,
  generatedAt,
}: {
  input: PdfInput;
  generatedAt: string;
}) {
  const fieldConfig = normalizeFieldConfig(input.fieldConfig);
  const columns = getPdfDisplayColumns(fieldConfig);
  const summaryMetrics = getPdfSummaryMetrics(input.entries, fieldConfig);
  const shiftBreakdown = getPdfShiftBreakdown(input.entries, fieldConfig);
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

        <View style={styles.summaryRow}>
          {summaryMetrics.map((metric) => (
            <View key={metric.label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{metric.label}</Text>
              <Text style={styles.summaryValue}>{metric.value}</Text>
            </View>
          ))}
        </View>

        {shiftBreakdown ? (
          <Text style={styles.shiftBreakdown}>Shifts: {shiftBreakdown}</Text>
        ) : null}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDate}>Date</Text>
            <Text style={styles.colDuration}>Duration</Text>
            {columns.map((column) => (
              <Text
                key={column.id}
                style={column.fields.length > 1 ? styles.colPaired : styles.colDynamic}
              >
                {column.label}
              </Text>
            ))}
          </View>
          {input.entries.map((entry, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={styles.colDate}>{formatDate(entry.entryDate)}</Text>
              <Text style={styles.colDuration}>{formatDuration(entry.durationMinutes)}</Text>
              {columns.map((column) => {
                const value = formatPdfColumnValue(entry, column);
                const isMultiline = column.fields.length > 1 && value.includes("\n");

                return (
                  <Text
                    key={column.id}
                    style={[
                      column.fields.length > 1 ? styles.colPaired : styles.colDynamic,
                      ...(isMultiline ? [styles.cellMultiline] : []),
                    ]}
                  >
                    {value}
                  </Text>
                );
              })}
            </View>
          ))}
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

  const doc = <TimesheetDocument input={input} generatedAt={generatedAt} />;

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
