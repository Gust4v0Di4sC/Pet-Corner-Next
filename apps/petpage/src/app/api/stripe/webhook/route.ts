import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeServerClient, getStripeWebhookSecret } from "@/lib/stripe/stripe-server";
import { fulfillStripeCheckoutSession } from "@/features/cart-checkout/services/stripe-order-fulfillment.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HANDLED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
]);

function isCheckoutSession(value: Stripe.Event.Data.Object): value is Stripe.Checkout.Session {
  return (value as { object?: string }).object === "checkout.session";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Assinatura Stripe ausente." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripeServerClient().webhooks.constructEvent(
      rawBody,
      signature,
      getStripeWebhookSecret()
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Assinatura Stripe invalida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  if (!isCheckoutSession(event.data.object)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  try {
    const result = await fulfillStripeCheckoutSession(event.data.object);
    return NextResponse.json({ received: true, result });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Nao foi possivel processar o webhook Stripe.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
