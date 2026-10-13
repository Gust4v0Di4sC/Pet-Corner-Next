import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  createCustomerPetOnServer,
  parseCreateCustomerPetInput,
} from "@/features/account/services/pet-registration.server";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export const runtime = "nodejs";

export async function POST(request: Request) {
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

    console.error("Falha ao cadastrar pet no servidor.", error);
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel cadastrar o pet agora. Tente novamente." },
      { status: 500 }
    );
  }
}
