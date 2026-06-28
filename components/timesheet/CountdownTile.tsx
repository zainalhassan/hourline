"use client";

import { useEffect, useState } from "react";
import {
  formatCountdown,
  formatCountdownDateKey,
  getCountdownParts,
  getCountdownTargetFromDateKey,
} from "@/lib/timesheet/payCountdown";

type CountdownTileProps = {
  label: string;
  targetDate: string;
  pastLabel?: string;
};

export function CountdownTile({
  label,
  targetDate,
  pastLabel = "Now",
}: CountdownTileProps) {
  const target = getCountdownTargetFromDateKey(targetDate);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const parts = getCountdownParts(target, now);
  const isPast = parts.totalMs <= 0;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {isPast ? pastLabel : formatCountdown(parts)}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {formatCountdownDateKey(targetDate)}
      </p>
    </div>
  );
}
