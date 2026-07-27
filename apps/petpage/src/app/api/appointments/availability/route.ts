import { NextResponse } from "next/server";
import { getAppointmentAvailability } from "@/features/scheduling/services/firebase-appointments.server";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";

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
        error: getUserErrorMessage(
          error,
          "Nao foi possivel carregar os horarios agora. Tente novamente."
        ),
      },
      { status: 400 }
    );
  }
}
