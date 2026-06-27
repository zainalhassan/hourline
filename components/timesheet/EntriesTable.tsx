import type { TimeEntry } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getEntryFieldValue,
  getFieldLabel,
  getTableColumns,
  type StoredFieldConfig,
} from "@/lib/timesheet/fieldConfig";
import { formatDuration } from "@/lib/timesheet/periods";
import { EntriesDayList } from "@/components/timesheet/EntriesDayList";
import { EntriesPayPeriodList } from "@/components/timesheet/EntriesPayPeriodList";
import { EntryActions } from "@/components/timesheet/EntryActions";

type EntriesTableProps = {
  entries: TimeEntry[];
  fieldConfig: StoredFieldConfig;
  canEdit: boolean;
  view?: "week" | "pay";
};

function EntriesDesktopTable({
  entries,
  fieldConfig,
  canEdit,
}: Omit<EntriesTableProps, "view">) {
  const columns = getTableColumns(fieldConfig);

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Duration</TableHead>
            {columns.map((field) => (
              <TableHead key={field.kind === "builtIn" ? field.fieldKey : field.id}>
                {getFieldLabel(field)}
              </TableHead>
            ))}
            {canEdit && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                {entry.entryDate.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </TableCell>
              <TableCell>{formatDuration(entry.durationMinutes)}</TableCell>
              {columns.map((field) => (
                <TableCell
                  key={field.kind === "builtIn" ? field.fieldKey : field.id}
                  className="max-w-[200px] truncate"
                >
                  {getEntryFieldValue(entry, field) || "—"}
                </TableCell>
              ))}
              {canEdit && (
                <TableCell>
                  <EntryActions
                    entry={entry}
                    fieldConfig={fieldConfig}
                    periodId={entry.periodId}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function EntriesTable({ view = "week", ...props }: EntriesTableProps) {
  if (props.entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {view === "pay"
          ? "No entries in this pay period yet."
          : "No entries yet for this week."}
      </p>
    );
  }

  if (view === "pay") {
    return <EntriesPayPeriodList {...props} />;
  }

  return (
    <>
      <div className="lg:hidden">
        <EntriesDayList {...props} />
      </div>
      <div className="hidden lg:block">
        <EntriesDesktopTable {...props} />
      </div>
    </>
  );
}
