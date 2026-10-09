export function maskMobile(mobile: string | null | undefined): string {
  if (!mobile) return "—";
  const digits = mobile.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(10);
  const first = digits.slice(0, 2);
  const last = digits.slice(-2);
  return `${first}${"X".repeat(Math.max(0, digits.length - 4))}${last}`;
}