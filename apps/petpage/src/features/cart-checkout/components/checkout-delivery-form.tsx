"use client";

import Link from "next/link";
import type { ChangeEventHandler, SubmitEventHandler } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DeliveryFormState } from "@/features/cart-checkout/hooks/use-checkout-flow";
import { fieldInputClassName, fieldLabelClassName } from "./checkout-field-styles";

type CheckoutDeliveryFormProps = {
  deliveryForm: DeliveryFormState;
  disabled: boolean;
  isSavingDelivery: boolean;
  onInputChange: ChangeEventHandler<HTMLInputElement>;
  onSubmit: SubmitEventHandler<HTMLFormElement>;
};

export function CheckoutDeliveryForm({
  deliveryForm,
  disabled,
  isSavingDelivery,
  onInputChange,
  onSubmit,
}: CheckoutDeliveryFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
          <Label htmlFor="delivery-fullName" className={fieldLabelClassName()}>
            Nome completo
          </Label>
          <Input
            id="delivery-fullName"
            name="fullName"
            value={deliveryForm.fullName}
            onChange={onInputChange}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
            className={fieldInputClassName()}
            placeholder="Sua cidade"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="delivery-street" className={fieldLabelClassName()}>
            Endereço
          </Label>
          <Input
            id="delivery-street"
            name="street"
            value={deliveryForm.street}
            onChange={onInputChange}
            className={fieldInputClassName()}
            placeholder="Rua e referência"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="delivery-number" className={fieldLabelClassName()}>
            Número
          </Label>
          <Input
            id="delivery-number"
            name="number"
            value={deliveryForm.number}
            onChange={onInputChange}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
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
            onChange={onInputChange}
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
          disabled={disabled}
          className="h-11 rounded-full bg-[#d97706] px-6 text-base font-semibold text-white hover:bg-[#c86f0a] disabled:opacity-60"
        >
          {isSavingDelivery ? "Salvando..." : "Continuar"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
