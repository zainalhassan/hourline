import { formatDuration } from "@/lib/timesheet/periods";

type TodayHeroProps = {
  todayLabel: string;
  weekLabel: string;
  totalMinutes: number;
  entryCount: number;
  templateName: string;
  status: string;
};

export function TodayHero({
  todayLabel,
  weekLabel,
  totalMinutes,
  entryCount,
  templateName,
  status,
}: TodayHeroProps) {
  return (
    <div className="transit-eta-card overflow-hidden">
      <div
        className="transit-eta-card__header"
        style={{ backgroundColor: "var(--color-route-blue)" }}
      >
        Today
      </div>
      <div className="transit-eta-card__body space-y-1">
        <p className="text-2xl font-bold tracking-tight">{todayLabel}</p>
        <p className="text-sm text-muted-foreground">{weekLabel}</p>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <span>
            <span className="font-semibold text-foreground">
              {formatDuration(totalMinutes)}
            </span>{" "}
            this week
          </span>
          <span>
            <span className="font-semibold text-foreground">{entryCount}</span>{" "}
            entries
          </span>
          <span className="text-muted-foreground">
            {templateName} · {status.toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
