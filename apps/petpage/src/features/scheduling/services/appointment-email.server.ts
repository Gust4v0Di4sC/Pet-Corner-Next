import "server-only";

import nodemailer from "nodemailer";
import { buildGoogleCalendarAddUrl } from "@/features/scheduling/utils/calendar-links";

type AppointmentEmailInput = {
  customerEmail: string;
  customerName: string;
  serviceName: string;
  scheduledStartIso: string;
  scheduledEndIso: string;
  notes?: string;
};

function readOptionalEnv(name: string): string {
  return process.env[name]?.trim() || "";
}

function isEmailEnabled(): boolean {
  return readOptionalEnv("APPOINTMENT_EMAIL_ENABLED").toLowerCase() === "true";
}

function getSmtpPort(): number {
  const parsedPort = Number(readOptionalEnv("SMTP_PORT") || "587");
  return Number.isFinite(parsedPort) ? parsedPort : 587;
}

function hasSmtpConfig(): boolean {
  return Boolean(
    readOptionalEnv("SMTP_HOST") &&
      readOptionalEnv("SMTP_USER") &&
      readOptionalEnv("SMTP_PASS") &&
      readOptionalEnv("SMTP_FROM")
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export async function sendAppointmentCalendarEmail(
  input: AppointmentEmailInput
): Promise<"sent" | "disabled" | "missing_config" | "missing_email"> {
  const normalizedEmail = input.customerEmail.trim();
  if (!normalizedEmail) {
    return "missing_email";
  }

  if (!isEmailEnabled()) {
    return "disabled";
  }

  if (!hasSmtpConfig()) {
    return "missing_config";
  }

  const calendarUrl = buildGoogleCalendarAddUrl(input);
  const transporter = nodemailer.createTransport({
    host: readOptionalEnv("SMTP_HOST"),
    port: getSmtpPort(),
    secure: getSmtpPort() === 465,
    auth: {
      user: readOptionalEnv("SMTP_USER"),
      pass: readOptionalEnv("SMTP_PASS"),
    },
  });

  await transporter.sendMail({
    from: readOptionalEnv("SMTP_FROM"),
    to: normalizedEmail,
    subject: `Salvar agendamento PetCorner - ${input.serviceName}`,
    text: [
      `Olá, ${input.customerName || "cliente"}.`,
      "",
      "Use o link abaixo para salvar seu agendamento no Google Agenda:",
      calendarUrl,
      "",
      `Serviço: ${input.serviceName}`,
      `Início: ${formatDateTime(input.scheduledStartIso)}`,
      `Fim: ${formatDateTime(input.scheduledEndIso)}`,
    ].join("\n"),
    html: `
      <p>Olá, ${input.customerName || "cliente"}.</p>
      <p>Use o link abaixo para salvar seu agendamento no Google Agenda:</p>
      <p><a href="${calendarUrl}">Adicionar ao Google Agenda</a></p>
      <p><strong>Serviço:</strong> ${input.serviceName}</p>
      <p><strong>Início:</strong> ${formatDateTime(input.scheduledStartIso)}</p>
      <p><strong>Fim:</strong> ${formatDateTime(input.scheduledEndIso)}</p>
    `,
  });

  return "sent";
}
