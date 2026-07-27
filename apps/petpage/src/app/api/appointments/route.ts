import { NextResponse } from "next/server";
import { createAppointment } from "@/features/scheduling/services/firebase-appointments.server";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

function readBearerToken(request: Request): string {
  const authorizationHeader = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
  return match?.[1]?.trim() || "";
}

export async function POST(request: Request) {
  const idToken = readBearerToken(request);
  if (!idToken) {
    return NextResponse.json(
      { ok: false, error: "Faça login para criar um agendamento." },
      { status: 401 }
    );
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const appointment = await createAppointment({
      idToken,
      serviceId: String(payload.serviceId || ""),
      dateKey: String(payload.dateKey || ""),
      startTime: String(payload.startTime || ""),
      notes: String(payload.notes || ""),
    });

    return NextResponse.json({ ok: true, appointment }, { status: 201 });
  } catch (error) {
    const message = getUserErrorMessage(
      error,
      "Nao foi possivel criar o agendamento agora. Tente novamente.",
      {
        permissionMessage: "Sua sessao expirou. Entre novamente para criar o agendamento.",
      }
    );
    const status = message.toLowerCase().includes("sessao") ? 401 : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
