export function toCurrency(valueInCents: number): string {
  return (valueInCents / 100).toFixed(2);
}
