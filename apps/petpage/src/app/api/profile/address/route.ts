import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  parseSaveCustomerAddressInput,
  saveCustomerAddressOnServer,
} from "@/features/account/services/address-registration.server";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";
import { getRequestId, guardApiMutation } from "@/lib/http/route-security";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  const requestId = getRequestId(request);
  const blocked = await guardApiMutation(request, { maxBytes: 16 * 1024 });
  if (blocked) return blocked;
  const session = await readServerCustomerSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sua sessao expirou. Entre novamente para salvar o endereco." },
      { status: 401 }
    );
  }

  try {
    const payload = await request.json();
    const addressInput = parseSaveCustomerAddressInput(payload);
    const address = await saveCustomerAddressOnServer({
      customerId: session.customerId,
      address: addressInput,
    });

    return NextResponse.json({ ok: true, address });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: "Revise os dados informados para salvar o endereco." },
        { status: 400 }
      );
    }

    logEvent("error", "profile_address_save_failed", { requestId, route: "/api/profile/address", error });
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel salvar o endereco agora. Tente novamente." },
      { status: 500 }
    );
  }
}
