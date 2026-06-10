/** All money is integer cents until the moment it is displayed. */

export function formatCents(cents: number, opts: { exact?: boolean } = {}): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.exact ? 2 : 0,
    maximumFractionDigits: opts.exact ? 2 : 0,
  });
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
