import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { checkoutDeliveryStepSchema } from "@/validation/checkout-schemas";
import { readServerCustomerSession } from "@/utils/auth/customer-session.server";
import { getFirstZodErrorMessage } from "@/utils/validation/input-sanitizers";
import {
  DEFAULT_CHECKOUT_SHIPPING_IN_CENTS,
  loadServerCustomerCart,
  resolveCheckoutCart,
  saveStripePendingCheckout,
} from "@/services/cart-checkout/stripe-order-fulfillment.server";
import { getPublicAppUrl, getStripeServerClient } from "@/infrastructure/stripe/stripe-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function toSafeServerErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nao foi possivel iniciar o checkout Stripe.";
}

function isPixPaymentMethodUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("pix") && message.includes("invalid");
}

function toAbsoluteImageUrl(imageUrl: string | undefined): string[] | undefined {
  const normalizedImageUrl = imageUrl?.trim();
  if (!normalizedImageUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(normalizedImageUrl);
    return ["http:", "https:"].includes(parsedUrl.protocol) ? [parsedUrl.toString()] : undefined;
  } catch {
    return undefined;
  }
}

type CheckoutLineItem = {
  quantity: number;
  price_data: {
    currency: "brl";
    unit_amount: number;
    product_data: {
      name: string;
      images?: string[];
      metadata?: Record<string, string>;
    };
  };
};

function buildLineItems(
  cart: Awaited<ReturnType<typeof loadServerCustomerCart>>,
  shippingInCents: number
): CheckoutLineItem[] {
  const productLineItems = cart.items.map((item): CheckoutLineItem => ({
    quantity: item.quantity,
    price_data: {
      currency: "brl",
      unit_amount: item.unitPriceInCents,
      product_data: {
        name: item.title,
        images: toAbsoluteImageUrl(item.imageUrl),
        metadata: {
          productId: item.productId,
          category: item.category || "",
        },
      },
    },
  }));

  if (shippingInCents <= 0) {
    return productLineItems;
  }

  return [
    ...productLineItems,
    {
      quantity: 1,
      price_data: {
        currency: "brl",
        unit_amount: shippingInCents,
        product_data: {
          name: "Frete Pet Corner",
          metadata: {
            kind: "shipping",
          },
        },
      },
    },
  ];
}

export async function POST(request: Request) {
  const session = await readServerCustomerSession();
  if (!session) {
    return jsonError("Faca login para finalizar o pedido.", 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonError("Payload invalido.", 400);
  }

  const body = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const parsedDelivery = checkoutDeliveryStepSchema.safeParse(body.delivery);
  if (!parsedDelivery.success) {
    return jsonError(
      getFirstZodErrorMessage(parsedDelivery.error, "Confira os dados de entrega."),
      400
    );
  }

  try {
    const cart = await resolveCheckoutCart(
      session.customerId,
      (body.cart && typeof body.cart === "object"
        ? (body.cart as Record<string, unknown>).items
        : undefined)
    );
    if (!cart.items.length) {
      return jsonError("Seu carrinho esta vazio.", 400);
    }

    if (cart.subtotalInCents <= 0) {
      return jsonError("O carrinho precisa ter valor maior que zero.", 400);
    }

    const shippingInCents = DEFAULT_CHECKOUT_SHIPPING_IN_CENTS;
    const appUrl = getPublicAppUrl();
    const stripe = getStripeServerClient();
    type CreateCheckoutSessionParams = NonNullable<
      Parameters<typeof stripe.checkout.sessions.create>[0]
    >;
    const metadata: Stripe.MetadataParam = {
      customerId: session.customerId,
      shippingInCents: String(shippingInCents),
      deliveryFullName: parsedDelivery.data.fullName,
      deliveryPhone: parsedDelivery.data.phone,
      deliveryZipCode: parsedDelivery.data.zipCode,
      deliveryCity: parsedDelivery.data.city,
      deliveryStreet: parsedDelivery.data.street,
      deliveryNumber: parsedDelivery.data.number,
      deliveryDistrict: parsedDelivery.data.district,
      deliveryState: parsedDelivery.data.state,
      deliveryComplement: parsedDelivery.data.complement || "",
    };

    const checkoutParams: CreateCheckoutSessionParams = {
      mode: "payment",
      currency: "brl",
      payment_method_types: ["card", "pix"],
      client_reference_id: session.customerId,
      customer_email: session.email,
      line_items: buildLineItems(cart, shippingInCents),
      metadata,
      payment_intent_data: {
        metadata,
      },
      success_url: `${appUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancelado`,
    };

    let checkoutSession;
    try {
      checkoutSession = await stripe.checkout.sessions.create(checkoutParams);
    } catch (error) {
      if (!isPixPaymentMethodUnavailable(error)) {
        throw error;
      }

      checkoutSession = await stripe.checkout.sessions.create({
        ...checkoutParams,
        payment_method_types: ["card"],
        metadata: {
          ...metadata,
          pixFallbackReason: "pix_unavailable",
        },
        payment_intent_data: {
          metadata: {
            ...metadata,
            pixFallbackReason: "pix_unavailable",
          },
        },
      });
    }

    if (!checkoutSession.url) {
      return jsonError("Stripe nao retornou uma URL de checkout.", 502);
    }

    await saveStripePendingCheckout({
      checkoutSessionId: checkoutSession.id,
      customerId: session.customerId,
      cart,
      delivery: parsedDelivery.data,
      shippingInCents,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return jsonError(toSafeServerErrorMessage(error), 500);
  }
}
