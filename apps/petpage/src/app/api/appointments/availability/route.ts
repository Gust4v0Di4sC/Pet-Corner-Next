import { NextResponse } from "next/server";
import { getAppointmentAvailability } from "@/features/scheduling/services/firebase-appointments.server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("serviceId") || "";
  const dateKey = url.searchParams.get("date") || "";

  try {
    const availability = await getAppointmentAvailability({ serviceId, dateKey });
    return NextResponse.json({ ok: true, availability });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Não foi possível carregar os horários.",
      },
      { status: 400 }
    );
  }
}
