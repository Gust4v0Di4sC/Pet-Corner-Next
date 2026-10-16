import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  parseCustomerTestimonialInput,
  saveCustomerTestimonial,
} from "@/features/marketing/services/customer-testimonial.server";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";
import { getRequestId, guardApiMutation } from "@/lib/http/route-security";
import { logEvent } from "@/lib/observability/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const blocked = await guardApiMutation(request, { maxBytes: 8 * 1024 });
  if (blocked) return blocked;
  const session = await readServerCustomerSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Entre na sua conta de cliente para enviar um depoimento." },
      { status: 401 }
    );
  }

  try {
    const testimonial = parseCustomerTestimonialInput(await request.json());
    const savedTestimonial = await saveCustomerTestimonial({
      customerId: session.customerId,
      customerName: session.name,
      customerEmail: session.email,
      testimonial,
    });

    revalidatePath("/");
    revalidateTag("testimonials", "max");
    return NextResponse.json({ ok: true, testimonial: savedTestimonial }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: "Escreva um depoimento entre 20 e 600 caracteres." },
        { status: 400 }
      );
    }

    logEvent("error", "testimonial_save_failed", { requestId, route: "/api/testimonials", error });
    return NextResponse.json(
      { ok: false, error: "Nao foi possivel enviar seu depoimento agora. Tente novamente." },
      { status: 500 }
    );
  }
}
