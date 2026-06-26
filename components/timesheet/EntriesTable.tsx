import type { TimeEntry } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TIMESHEET_FIELDS, type EntryMetadata, type TemplateFieldConfig } from "@/lib/timesheet/fields";
import { formatDuration } from "@/lib/timesheet/periods";
import { EntryActions } from "@/components/timesheet/EntryActions";

type EntriesTableProps = {
  entries: TimeEntry[];
  fields: TemplateFieldConfig[];
  periodId: string;
  canEdit: boolean;
};

function getMeta(entry: TimeEntry): EntryMetadata {
  return (entry.metadata as EntryMetadata) ?? {};
}

export function EntriesTable({ entries, fields, periodId, canEdit }: EntriesTableProps) {
  const visibleMetaFields = fields.filter(
    (f) =>
      f.visible &&
      f.fieldKey !== "durationMinutes" &&
      f.fieldKey !== "mileage",
  );

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
            {visibleMetaFields.map((f) => (
              <TableHead key={f.fieldKey}>{TIMESHEET_FIELDS[f.fieldKey].label}</TableHead>
            ))}
            {fields.some((f) => f.visible && f.fieldKey === "mileage") && (
              <TableHead>Mileage</TableHead>
            )}
            {canEdit && <TableHead className="w-24">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const meta = getMeta(entry);
            return (
              <TableRow key={entry.id}>
                <TableCell>
                  {entry.entryDate.toLocaleDateString("en-GB", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </TableCell>
                <TableCell>{formatDuration(entry.durationMinutes)}</TableCell>
                {visibleMetaFields.map((f) => (
                  <TableCell key={f.fieldKey} className="max-w-[200px] truncate">
                    {f.fieldKey === "billable"
                      ? meta.billable
                        ? "Yes"
                        : "No"
                      : (meta[f.fieldKey as keyof EntryMetadata] as string) ?? "—"}
                  </TableCell>
                ))}
                {fields.some((f) => f.visible && f.fieldKey === "mileage") && (
                  <TableCell>{entry.mileage != null ? Number(entry.mileage) : "—"}</TableCell>
                )}
                {canEdit && (
                  <TableCell>
                    <EntryActions entry={entry} fields={fields} periodId={periodId} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
