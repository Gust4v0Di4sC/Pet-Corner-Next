"use client";

import Image from "next/image";
import Link from "next/link";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CreditCard, Lock, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import fallbackProduct from "@/assets/fallbackproduct.png";
import { useCustomerCart } from "@/features/cart-checkout/hooks/use-customer-cart";
import { saveCustomerDeliveryAddress } from "@/features/account/services/customer-profile.service";
import { getCartItemsCount } from "@/features/cart-checkout/services/customer-cart.service";
import { formatPriceBRL } from "@/lib/formatters/price";
import {
  applyZipCodeMask,
  digitsOnly,
  getFirstZodErrorMessage,
  normalizeStateCode,
} from "@/lib/validation/input-sanitizers";
import {
  checkoutDeliveryStepSchema,
} from "@/features/cart-checkout/validation/checkout-schemas";

type CheckoutFormProps = {
  customerId: string;
  customerName?: string;
  customerEmail: string;
};

type CheckoutStep = "delivery" | "payment";

type DeliveryFormState = {
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

function fieldLabelClassName() {
  return "text-xs font-semibold uppercase tracking-[0.06em] text-amber-50/70";
}

function fieldInputClassName() {
  return "h-12 w-full rounded-full border border-[#6a4109] bg-[#4a2d03] px-4 text-sm text-amber-50 outline-none transition placeholder:text-amber-100/40 focus:border-[#fb8b24] focus:ring-2 focus:ring-[#fb8b24]/30";
}

function stepLabelClassName(isActive: boolean) {
  return isActive ? "text-amber-50" : "text-amber-100/65";
}

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

export function CheckoutForm({ customerId, customerName, customerEmail }: CheckoutFormProps) {
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

  const itemsCount = getCartItemsCount(cart);
  const hasItems = cart.items.length > 0;
  const shippingInCents = hasItems ? DELIVERY_FEE_IN_CENTS : 0;
  const totalInCents = cart.subtotalInCents + shippingInCents;
  const previewItems = useMemo(() => cart.items.slice(0, 5), [cart.items]);
  const hiddenItemsCount = Math.max(cart.items.length - previewItems.length, 0);

  const handleDeliveryInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    const nextValue =
      name === "phone"
        ? formatPhoneMask(value)
        : name === "zipCode"
          ? applyZipCodeMask(value)
          : name === "state"
            ? normalizeStateCode(value)
            : value;

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
      const response = await fetch("/api/stripe/checkout/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          delivery: parsedDelivery.data,
          cart: {
            items: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !result.url) {
        throw new Error(result.error || "Nao foi possivel iniciar o checkout Stripe.");
      }

      setSuccessMessage("Redirecionando para o Stripe Checkout.");
      window.location.assign(result.url);
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

  return (
    <section className="space-y-7">
      <header className="space-y-3">
        <h1 className="text-5xl font-bold leading-[1.02] text-slate-100 md:text-7xl">Checkout</h1>
        <div className="inline-flex items-center gap-3 text-base font-semibold">
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
              activeStep === "delivery" ? "bg-[#fb8b24] text-white" : "bg-[#5b3a0f] text-amber-100/80"
            }`}
          >
            1
          </span>
          <span className={stepLabelClassName(activeStep === "delivery")}>Entrega</span>
          <span className="h-px w-12 bg-amber-100/25" aria-hidden="true" />
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
              activeStep === "payment" ? "bg-[#fb8b24] text-white" : "bg-[#5b3a0f] text-amber-100/80"
            }`}
          >
            2
          </span>
          <span className={stepLabelClassName(activeStep === "payment")}>Pagamento</span>
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] py-0 text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
          <CardHeader className="border-b border-slate-700/80 pb-5 pt-6">
            <CardTitle className="flex items-center gap-2 text-4xl font-semibold text-slate-100">
              {activeStep === "delivery" ? (
                <>
                  <Truck className="h-6 w-6 text-[#fb8b24]" />
                  Endereco de entrega
                </>
              ) : (
                <>
                  <CreditCard className="h-6 w-6 text-[#fb8b24]" />
                  Pagamento
                </>
              )}
            </CardTitle>
            <p className="text-sm text-slate-300">
              {activeStep === "delivery"
                ? "Preencha os dados para envio do pedido."
                : "Confira o pedido e siga para o Checkout seguro do Stripe."}
            </p>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            {errorMessage ? (
              <p className="rounded-2xl border border-red-300/50 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-100">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl border border-emerald-300/40 bg-emerald-950/40 px-4 py-3 text-sm font-medium text-emerald-100">
                {successMessage}
              </p>
            ) : null}

            {activeStep === "delivery" ? (
              <form className="space-y-5" onSubmit={(event) => void handleContinueToPayment(event)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="delivery-fullName" className={fieldLabelClassName()}>
                      Nome completo
                    </Label>
                    <Input
                      id="delivery-fullName"
                      name="fullName"
                      value={deliveryForm.fullName}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                    <Label htmlFor="delivery-phone" className={fieldLabelClassName()}>
                      Telefone
                    </Label>
                    <Input
                      id="delivery-phone"
                      name="phone"
                      value={deliveryForm.phone}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-zipCode" className={fieldLabelClassName()}>
                      CEP
                    </Label>
                    <Input
                      id="delivery-zipCode"
                      name="zipCode"
                      value={deliveryForm.zipCode}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-city" className={fieldLabelClassName()}>
                      Cidade
                    </Label>
                    <Input
                      id="delivery-city"
                      name="city"
                      value={deliveryForm.city}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="Sua cidade"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="delivery-street" className={fieldLabelClassName()}>
                      Endereco
                    </Label>
                    <Input
                      id="delivery-street"
                      name="street"
                      value={deliveryForm.street}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="Rua e referencia"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-number" className={fieldLabelClassName()}>
                      Numero
                    </Label>
                    <Input
                      id="delivery-number"
                      name="number"
                      value={deliveryForm.number}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="123"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-complement" className={fieldLabelClassName()}>
                      Complemento
                    </Label>
                    <Input
                      id="delivery-complement"
                      name="complement"
                      value={deliveryForm.complement}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-district" className={fieldLabelClassName()}>
                      Bairro
                    </Label>
                    <Input
                      id="delivery-district"
                      name="district"
                      value={deliveryForm.district}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="Seu bairro"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="delivery-state" className={fieldLabelClassName()}>
                      Estado
                    </Label>
                    <Input
                      id="delivery-state"
                      name="state"
                      value={deliveryForm.state}
                      onChange={handleDeliveryInputChange}
                      className={fieldInputClassName()}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <Link
                    href="/cart"
                    suppressHydrationWarning
                    className="inline-flex items-center gap-2 text-sm font-semibold text-amber-100/90 transition hover:text-amber-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao carrinho
                  </Link>

                  <Button
                    type="submit"
                    disabled={isSavingDelivery || isLoading || !hasItems}
                    className="h-11 rounded-full bg-[#d97706] px-6 text-base font-semibold text-white hover:bg-[#c86f0a] disabled:opacity-60"
                  >
                    {isSavingDelivery ? "Salvando..." : "Continuar"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(event) => void handleCreateStripeCheckoutSession(event)}
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
                    <p className="text-sm font-semibold text-slate-100">Entrega</p>
                    <p className="mt-2 text-sm text-slate-300">
                      {deliveryForm.fullName}
                      <br />
                      {deliveryForm.street}, {deliveryForm.number} - {deliveryForm.district}
                      <br />
                      {deliveryForm.city}/{deliveryForm.state} - {deliveryForm.zipCode}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-700 bg-[#111b2b] p-4">
                    <p className="text-sm font-semibold text-slate-100">Pagamento</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200">
                        Cartao
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold text-slate-200">
                        Pix
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">
                      O pagamento sera concluido no ambiente hospedado do Stripe.
                    </p>
                  </div>
                </div>

                <p className="inline-flex items-center gap-2 text-sm text-amber-100/70">
                  <Lock className="h-4 w-4" />
                  Pedido criado somente apos confirmacao de pagamento pelo Stripe.
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setActiveStep("delivery")}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-amber-100/90 transition hover:text-amber-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isCreatingStripeSession || isLoading || !hasItems}
                    className="h-11 rounded-full bg-[#d97706] px-6 text-base font-semibold text-white hover:bg-[#c86f0a] disabled:opacity-60"
                  >
                    {isCreatingStripeSession ? "Abrindo Stripe..." : "Pagar com Stripe"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-slate-700/90 bg-[#0f1722] py-0 text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)] xl:sticky xl:top-24">
          <CardHeader className="border-b border-slate-700/80 pb-5 pt-6">
            <CardTitle className="text-4xl font-semibold text-slate-100">Seu pedido</CardTitle>
            <p className="text-xs text-slate-400">Conta: {customerEmail}</p>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            {cartErrorMessage ? (
              <p className="rounded-2xl border border-red-300/50 bg-red-950/40 px-4 py-3 text-sm font-medium text-red-100">
                {cartErrorMessage}
              </p>
            ) : null}

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-14 animate-pulse rounded-2xl border border-slate-700 bg-slate-900/70"
                  />
                ))}
              </div>
            ) : !hasItems ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-sm text-slate-300">
                Seu carrinho esta vazio. Volte para produtos para continuar.
              </div>
            ) : (
              <>
                <ul className="space-y-3">
                  {previewItems.map((item) => {
                    const imageUrl = item.imageUrl?.trim() || fallbackProduct.src;

                    return (
                      <li
                        key={item.productId}
                        className="grid grid-cols-[auto_1fr_auto] items-center gap-3"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                          <Image
                            src={imageUrl}
                            alt={item.title}
                            fill
                            sizes="48px"
                            unoptimized={/^https?:\/\//i.test(imageUrl)}
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-100">{item.title}</p>
                          <p className="text-xs text-slate-400">x{item.quantity}</p>
                        </div>

                        <p className="text-sm font-semibold text-slate-100">
                          {formatPriceBRL(item.quantity * item.unitPriceInCents)}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                {hiddenItemsCount > 0 ? (
                  <p className="text-xs text-slate-400">+{hiddenItemsCount} item(ns) no pedido</p>
                ) : null}
              </>
            )}

            <div className="space-y-2 border-t border-slate-700/80 pt-4">
              <div className="flex items-center justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-100">
                  {formatPriceBRL(cart.subtotalInCents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Frete</span>
                <span className="font-semibold text-slate-100">{formatPriceBRL(shippingInCents)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-2xl font-semibold text-slate-100">Total</span>
                <span className="text-4xl font-bold text-[#fb8b24]">{formatPriceBRL(totalInCents)}</span>
              </div>
              <p className="text-xs text-slate-400">{itemsCount} item(ns) no carrinho.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
