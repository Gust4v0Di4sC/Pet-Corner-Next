import { NextResponse } from "next/server";
import { sendAppointmentEmailForCustomer } from "@/features/scheduling/services/firebase-appointments.server";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";
import { getUserErrorMessage } from "@/lib/errors/user-error-messages";
import { guardApiMutation } from "@/lib/http/route-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const blocked = await guardApiMutation(request, { maxBytes: 8 * 1024 });
  if (blocked) return blocked;
  const session = await readServerCustomerSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sua sessao expirou. Entre novamente para enviar a confirmacao." },
      { status: 401 }
    );
  }

  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    await sendAppointmentEmailForCustomer({
      appointmentId: String(payload.appointmentId || ""),
      customerId: session.customerId,
      customerEmail: session.email,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getUserErrorMessage(
          error,
          "Nao foi possivel enviar a confirmacao por e-mail agora."
        ),
      },
      { status: 400 }
    );
  }
}
