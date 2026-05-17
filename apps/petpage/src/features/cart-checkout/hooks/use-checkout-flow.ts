"use client";

import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { saveCustomerDeliveryAddress } from "@/features/account/services/customer-profile.service";
import { useCustomerCart } from "@/features/cart-checkout/hooks/use-customer-cart";
import { getCartItemsCount } from "@/features/cart-checkout/services/customer-cart.service";
import { createStripeCheckoutSession } from "@/features/cart-checkout/services/stripe-checkout.service";
import { checkoutDeliveryStepSchema } from "@/features/cart-checkout/validation/checkout-schemas";
import {
  applyZipCodeMask,
  digitsOnly,
  getFirstZodErrorMessage,
  normalizeStateCode,
} from "@/lib/validation/input-sanitizers";

export type CheckoutStep = "delivery" | "payment";

export type DeliveryFormState = {
  fullName: string;
  phone: string;
  zipCode: string;
  city: string;
  street: string;
  number: string;
  district: string;
  state: string;
  complement: string;
};

const DELIVERY_FEE_IN_CENTS = 1490;

function isPermissionDeniedError(error: unknown): boolean {
  if (error && typeof error === "object" && (error as { code?: unknown }).code === "permission-denied") {
    return true;
  }

  return error instanceof Error && error.message.toLowerCase().includes("permission");
}

function formatPhoneMask(value: string): string {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) {
    return "";
  }
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeDeliveryInput(name: string, value: string): string {
  if (name === "phone") {
    return formatPhoneMask(value);
  }

  if (name === "zipCode") {
    return applyZipCodeMask(value);
  }

  if (name === "state") {
    return normalizeStateCode(value);
  }

  return value;
}

type UseCheckoutFlowInput = {
  customerId: string;
  customerName?: string;
};

export function useCheckoutFlow({ customerId, customerName }: UseCheckoutFlowInput) {
  const [activeStep, setActiveStep] = useState<CheckoutStep>("delivery");
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isCreatingStripeSession, setIsCreatingStripeSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>({
    fullName: customerName?.trim() || "",
    phone: "",
    zipCode: "",
    city: "",
    street: "",
    number: "",
    district: "",
    state: "",
    complement: "",
  });

  const { isLoading, errorMessage: cartErrorMessage, cart } = useCustomerCart({
    customerId,
  });

  const previewItems = useMemo(() => cart.items.slice(0, 5), [cart.items]);
  const itemsCount = getCartItemsCount(cart);
  const hasItems = cart.items.length > 0;
  const shippingInCents = hasItems ? DELIVERY_FEE_IN_CENTS : 0;
  const totalInCents = cart.subtotalInCents + shippingInCents;
  const hiddenItemsCount = Math.max(cart.items.length - previewItems.length, 0);

  const handleDeliveryInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const nextValue = normalizeDeliveryInput(name, value);

    setDeliveryForm((currentValue) => ({
      ...currentValue,
      [name]: nextValue,
    }));
  };

  const handleContinueToPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedDelivery = checkoutDeliveryStepSchema.safeParse(deliveryForm);
    if (!parsedDelivery.success) {
      setErrorMessage(
        getFirstZodErrorMessage(parsedDelivery.error, "Confira os dados da entrega.")
      );
      return;
    }

    setIsSavingDelivery(true);

    try {
      try {
        await saveCustomerDeliveryAddress({
          customerId,
          zipCode: parsedDelivery.data.zipCode,
          street: parsedDelivery.data.street,
          number: parsedDelivery.data.number,
          district: parsedDelivery.data.district,
          city: parsedDelivery.data.city,
          state: parsedDelivery.data.state,
          complement: parsedDelivery.data.complement,
        });
      } catch (error) {
        if (!isPermissionDeniedError(error)) {
          throw error;
        }
      }

      setActiveStep("payment");
      setSuccessMessage("Endereco validado e salvo. Confira o resumo antes de pagar.");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel salvar o endereco agora.";
      setErrorMessage(message);
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleCreateStripeCheckoutSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasItems) {
      setErrorMessage("Seu carrinho esta vazio. Adicione produtos para finalizar.");
      return;
    }

    const parsedDelivery = checkoutDeliveryStepSchema.safeParse(deliveryForm);
    if (!parsedDelivery.success) {
      setActiveStep("delivery");
      setErrorMessage(
        getFirstZodErrorMessage(parsedDelivery.error, "Confira os dados de entrega.")
      );
      return;
    }

    setIsCreatingStripeSession(true);

    try {
      const checkoutUrl = await createStripeCheckoutSession({
        delivery: parsedDelivery.data,
        cart: {
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      });

      setSuccessMessage("Redirecionando para o Stripe Checkout.");
      window.location.assign(checkoutUrl);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel iniciar o checkout Stripe.";
      setErrorMessage(message);
    } finally {
      setIsCreatingStripeSession(false);
    }
  };

  const handleBackToDelivery = () => {
    setActiveStep("delivery");
  };

  return {
    data: {
      activeStep,
      deliveryForm,
      cart,
      previewItems,
      itemsCount,
      hasItems,
      shippingInCents,
      totalInCents,
      hiddenItemsCount,
    },
    state: {
      isLoading,
      cartErrorMessage,
      isSavingDelivery,
      isCreatingStripeSession,
      errorMessage,
      successMessage,
    },
    actions: {
      onDeliveryInputChange: handleDeliveryInputChange,
      onContinueToPayment: handleContinueToPayment,
      onCreateStripeCheckoutSession: handleCreateStripeCheckoutSession,
      onBackToDelivery: handleBackToDelivery,
    },
  };
}
