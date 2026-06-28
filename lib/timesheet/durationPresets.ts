export const DEFAULT_HOUR_PRESETS = [0, 1, 2, 3, 4] as const;
export const DEFAULT_MINUTE_PRESETS = [0, 15, 30, 45] as const;
export const MAX_CUSTOM_DURATION_PRESETS = 8;

export type StoredDurationPresets = {
  customHours?: number[];
  customMinutes?: number[];
};

export function normalizeDurationPresets(raw: unknown): StoredDurationPresets {
  if (!raw || typeof raw !== "object") {
    return { customHours: [], customMinutes: [] };
  }

  const obj = raw as StoredDurationPresets;
  return {
    customHours: sanitizeCustomHours(obj.customHours),
    customMinutes: sanitizeCustomMinutes(obj.customMinutes),
  };
}

export function sanitizeCustomHours(list?: number[]): number[] {
  if (!Array.isArray(list)) return [];

  const defaults = new Set<number>(DEFAULT_HOUR_PRESETS);
  return [...new Set(list)]
    .filter((h) => Number.isInteger(h) && h >= 0 && h <= 24)
    .filter((h) => !defaults.has(h))
    .sort((a, b) => a - b)
    .slice(0, MAX_CUSTOM_DURATION_PRESETS);
}

export function sanitizeCustomMinutes(list?: number[]): number[] {
  if (!Array.isArray(list)) return [];

  const defaults = new Set<number>(DEFAULT_MINUTE_PRESETS);
  return [...new Set(list)]
    .filter((m) => Number.isInteger(m) && m >= 0 && m <= 59)
    .filter((m) => !defaults.has(m))
    .sort((a, b) => a - b)
    .slice(0, MAX_CUSTOM_DURATION_PRESETS);
}

export function getHourPresets(stored: StoredDurationPresets): number[] {
  return [...new Set([...DEFAULT_HOUR_PRESETS, ...sanitizeCustomHours(stored.customHours)])].sort(
    (a, b) => a - b,
  );
}

export function getMinutePresets(stored: StoredDurationPresets): number[] {
  return [
    ...new Set([...DEFAULT_MINUTE_PRESETS, ...sanitizeCustomMinutes(stored.customMinutes)]),
  ].sort((a, b) => a - b);
}

export function isDefaultHourPreset(hours: number): boolean {
  return (DEFAULT_HOUR_PRESETS as readonly number[]).includes(hours);
}

export function isDefaultMinutePreset(minutes: number): boolean {
  return (DEFAULT_MINUTE_PRESETS as readonly number[]).includes(minutes);
}

export function formatHourChip(hours: number): string {
  return `${hours}h`;
}

export function formatMinuteChip(minutes: number): string {
  return `${minutes}m`;
}

export function formatDurationLabel(hours: number, minutes: number): string {
  const total = hours * 60 + minutes;
  if (total <= 0) return "0m";
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function countCustomPresets(stored: StoredDurationPresets): number {
  return (
    sanitizeCustomHours(stored.customHours).length +
    sanitizeCustomMinutes(stored.customMinutes).length
  );
}

export function canAddHourPreset(
  hours: number,
  stored: StoredDurationPresets,
): string | null {
  if (!Number.isInteger(hours) || hours < 0 || hours > 24) {
    return "Enter a valid hour between 0 and 24";
  }
  if (isDefaultHourPreset(hours)) {
    return "That hour is already a default button";
  }
  if (getHourPresets(stored).includes(hours)) {
    return "That hour button already exists";
  }
  if (sanitizeCustomHours(stored.customHours).length >= MAX_CUSTOM_DURATION_PRESETS) {
    return `Maximum ${MAX_CUSTOM_DURATION_PRESETS} custom hour buttons`;
  }
  return null;
}

export function canAddMinutePreset(
  minutes: number,
  stored: StoredDurationPresets,
): string | null {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return "Enter a valid minute between 0 and 59";
  }
  if (isDefaultMinutePreset(minutes)) {
    return "That minute is already a default button";
  }
  if (getMinutePresets(stored).includes(minutes)) {
    return "That minute button already exists";
  }
  if (sanitizeCustomMinutes(stored.customMinutes).length >= MAX_CUSTOM_DURATION_PRESETS) {
    return `Maximum ${MAX_CUSTOM_DURATION_PRESETS} custom minute buttons`;
  }
  return null;
}

export function addHourPreset(
  stored: StoredDurationPresets,
  hours: number,
): StoredDurationPresets {
  const error = canAddHourPreset(hours, stored);
  if (error) throw new Error(error);

  return {
    ...stored,
    customHours: sanitizeCustomHours([...(stored.customHours ?? []), hours]),
  };
}

export function addMinutePreset(
  stored: StoredDurationPresets,
  minutes: number,
): StoredDurationPresets {
  const error = canAddMinutePreset(minutes, stored);
  if (error) throw new Error(error);

  return {
    ...stored,
    customMinutes: sanitizeCustomMinutes([...(stored.customMinutes ?? []), minutes]),
  };
}

export function removeHourPreset(
  stored: StoredDurationPresets,
  hours: number,
): StoredDurationPresets {
  return {
    ...stored,
    customHours: sanitizeCustomHours(
      (stored.customHours ?? []).filter((h) => h !== hours),
    ),
  };
}

export function removeMinutePreset(
  stored: StoredDurationPresets,
  minutes: number,
): StoredDurationPresets {
  return {
    ...stored,
    customMinutes: sanitizeCustomMinutes(
      (stored.customMinutes ?? []).filter((m) => m !== minutes),
    ),
  };
}
