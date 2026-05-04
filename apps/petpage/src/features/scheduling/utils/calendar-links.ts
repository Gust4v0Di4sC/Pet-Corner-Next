type CalendarEventInput = {
  serviceName: string;
  customerName: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  notes?: string;
};

function toGoogleDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildDetails(input: CalendarEventInput): string {
  return [
    `Agendamento PetCorner para ${input.customerName || "cliente"}.`,
    input.notes?.trim() ? `Observações: ${input.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildGoogleCalendarAddUrl(input: CalendarEventInput): string {
  const startDate = toGoogleDate(input.scheduledStartIso);
  const endDate = toGoogleDate(input.scheduledEndIso);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `PetCorner - ${input.serviceName}`,
    dates: `${startDate}/${endDate}`,
    details: buildDetails(input),
    ctz: "America/Sao_Paulo",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildGoogleCalendarMailtoUrl(input: CalendarEventInput & { customerEmail: string }) {
  const calendarUrl = buildGoogleCalendarAddUrl(input);
  const subject = `Salvar agendamento PetCorner - ${input.serviceName}`;
  const body = [
    `Olá, ${input.customerName || "cliente"}.`,
    "",
    "Use o link abaixo para salvar seu agendamento no Google Agenda:",
    calendarUrl,
    "",
    `Serviço: ${input.serviceName}`,
    `Início: ${new Date(input.scheduledStartIso).toLocaleString("pt-BR")}`,
    `Fim: ${new Date(input.scheduledEndIso).toLocaleString("pt-BR")}`,
  ].join("\n");

  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${encodeURIComponent(input.customerEmail)}?${params.toString()}`;
}
