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
import { EntryActions } from "@/components/timesheet/EntryActions";

type EntriesTableProps = {
  entries: TimeEntry[];
  fieldConfig: StoredFieldConfig;
  periodId: string;
  canEdit: boolean;
};

export function EntriesTable({
  entries,
  fieldConfig,
  periodId,
  canEdit,
}: EntriesTableProps) {
  const columns = getTableColumns(fieldConfig);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No entries yet for this week.</p>
    );
  }

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
                    periodId={periodId}
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
