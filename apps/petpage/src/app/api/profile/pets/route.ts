import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createCustomerPetOnServer,
  listCustomerPetsOnServer,
  parseCreateCustomerPetInput,
} from "@/features/account/services/pet-registration.server";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";
import { getRequestId, guardApiMutation, guardAppCheck } from "@/lib/http/route-security";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const blocked = await guardAppCheck(request);
  if (blocked) return blocked;
  const session = await readServerCustomerSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sua sessao expirou. Entre novamente para consultar seus pets." },
      { status: 401 }
    );
  }

  try {
    const pets = await listCustomerPetsOnServer(session.customerId);
    return NextResponse.json({ ok: true, pets });
  } catch (error) {
    logEvent("error", "profile_pets_read_failed", { requestId, route: "/api/profile/pets", error });
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel carregar seus pets agora. Tente novamente." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const blocked = await guardApiMutation(request, { maxBytes: 16 * 1024 });
  if (blocked) return blocked;
  const session = await readServerCustomerSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Sua sessao expirou. Entre novamente para cadastrar o pet." },
      { status: 401 }
    );
  }

  try {
    const payload = await request.json();
    const petInput = parseCreateCustomerPetInput(payload);
    const pet = await createCustomerPetOnServer({
      customerId: session.customerId,
      customerName: session.name || session.email,
      pet: petInput,
    });

    return NextResponse.json({ ok: true, pet }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: "Revise os dados informados para cadastrar o pet." },
        { status: 400 }
      );
    }

    logEvent("error", "profile_pet_create_failed", { requestId, route: "/api/profile/pets", error });
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel cadastrar o pet agora. Tente novamente." },
      { status: 500 }
    );
  }
}
