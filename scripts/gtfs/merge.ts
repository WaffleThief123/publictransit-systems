type Plain = Record<string, unknown>;

function isPlainObject(v: unknown): v is Plain {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function mergeOverlay<T extends Plain>(base: T, overlay: Plain | undefined): T {
  if (!overlay) return base;
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(overlay)) {
    if (v === undefined) continue;
    const baseVal = (base as Plain)[k];
    if (isPlainObject(v) && isPlainObject(baseVal)) {
      out[k] = mergeOverlay(baseVal, v);
    } else {
      out[k] = v; // scalars, arrays, null all replace wholesale
    }
  }
  return out as T;
}
