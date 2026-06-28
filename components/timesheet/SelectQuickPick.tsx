"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type SelectQuickPickProps = {
  inputName: string;
  inputId: string;
  options: string[];
  defaultValue?: string;
  required?: boolean;
};

function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

export function SelectQuickPick({
  inputName,
  inputId,
  options,
  defaultValue = "",
  required = false,
}: SelectQuickPickProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
      <input
        id={inputId}
        type="hidden"
        name={inputName}
        value={value}
        required={required}
      />
      <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={inputId}>
        {options.map((option) => (
          <OptionChip
            key={option}
            label={option}
            active={value === option}
            onClick={() => setValue(option)}
          />
        ))}
      </div>
    </div>
  );
}
