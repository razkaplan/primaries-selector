export function fmtNis(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m >= 10 ? m.toFixed(0) : m.toFixed(1)} מיליון ₪`;
  }
  if (n >= 1_000) return `${Math.round(n / 1_000)} אלף ₪`;
  return `${n.toLocaleString("he-IL")} ₪`;
}
