/**
 * Compact count for stat readouts: 1_234 → "1.2k", 12_000 → "12k", 999 → "999".
 * Non-finite and non-positive values collapse to "0" instead of rendering NaN/Infinity.
 */
export function formatCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return value.toLocaleString("zh-CN");
}
