import { type ClassValue, clsx } from "clsx";
import type { Line } from "./types";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTermini(line: Line): string {
  const { termini, topology } = line;
  if (!termini.length) return "\u2014";

  switch (topology.type) {
    case "loop":
      return topology.referenceStation
        ? `\u21BB Loop via ${topology.referenceStation}`
        : "\u21BB Loop";
    case "lollipop":
      return `${termini[0]} \u2194 \u21BB Loop`;
    case "linear":
    default:
      if (termini.length <= 2) return termini.join(" \u2194 ");
      return `${termini[0]} \u2194 ${termini.slice(1).join(" / ")}`;
  }
}
