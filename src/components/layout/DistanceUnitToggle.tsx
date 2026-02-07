"use client";

import { useDistanceUnit } from "./DistanceUnitProvider";

export function DistanceUnitToggle() {
  const { unit, toggleUnit } = useDistanceUnit();

  return (
    <button
      onClick={toggleUnit}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors"
      title={`Switch to ${unit === "km" ? "miles" : "kilometers"}`}
    >
      <span className={unit === "km" ? "text-accent-primary" : ""}>km</span>
      <span className="text-text-muted">/</span>
      <span className={unit === "mi" ? "text-accent-primary" : ""}>mi</span>
    </button>
  );
}
