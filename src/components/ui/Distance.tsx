"use client";

import { useDistanceUnit } from "@/components/layout/DistanceUnitProvider";
import { convertDistance } from "@/lib/distance";
import type { DistanceUnit } from "@/lib/types";

interface DistanceProps {
  value: number;
  sourceUnit: DistanceUnit;
  decimals?: number;
  showUnit?: boolean;
  className?: string;
}

/**
 * Display a distance value, automatically converting to user's preferred unit
 */
export function Distance({
  value,
  sourceUnit,
  decimals = 1,
  showUnit = true,
  className,
}: DistanceProps) {
  const { unit: displayUnit } = useDistanceUnit();
  const converted = convertDistance(value, sourceUnit, displayUnit);
  const formatted = converted.toFixed(decimals);

  return (
    <span className={className}>
      {formatted}
      {showUnit && ` ${displayUnit}`}
    </span>
  );
}

/**
 * Hook to get converted distance value
 */
export function useConvertedDistance(value: number, sourceUnit: DistanceUnit): number {
  const { unit: displayUnit } = useDistanceUnit();
  return convertDistance(value, sourceUnit, displayUnit);
}
