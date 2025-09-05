// utils/dateUtils.ts
export function parseDateFromString(dateStr: string): Date | null {
  const [day, month, year] = dateStr.split("/");
  if (!day || !month || !year) return null;
  const parsedDate = new Date(`${year}-${month}-${day}`);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatDateToString(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}
