"use client";

import { useDistanceUnit } from "@/components/layout/DistanceUnitProvider";
import { convertDistance } from "@/lib/distance";
import type { DistanceUnit } from "@/lib/types";

interface DistanceValueProps {
  value: number;
  sourceUnit: DistanceUnit;
  decimals?: number;
}

/**
 * Returns just the numeric value converted to user's preferred unit
 */
export function DistanceValue({ value, sourceUnit, decimals = 1 }: DistanceValueProps) {
  const { unit: displayUnit } = useDistanceUnit();
  const converted = convertDistance(value, sourceUnit, displayUnit);
  return <>{converted.toFixed(decimals)}</>;
}

/**
 * Returns the current display unit label
 */
export function DistanceUnitLabel() {
  const { unit } = useDistanceUnit();
  return <>{unit}</>;
}
