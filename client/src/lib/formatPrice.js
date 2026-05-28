/**
 * Format a number as RWF currency
 * e.g. 15000 → "RWF 15,000"
 */
export function formatPrice(amount) {
  return `RWF ${Math.round(amount).toLocaleString('en-US')}`;
}
