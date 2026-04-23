"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkoutFormSchema } from "@/validation/checkout-schemas";
import {
  formatCpfCnpjMask,
  getFirstZodErrorMessage,
} from "@/utils/validation/input-sanitizers";

type CheckoutFormState = {
  address: string;
  document: string;
};

const INITIAL_FORM_STATE: CheckoutFormState = {
  address: "",
  document: "",
};

export function CheckoutForm() {
  const [formState, setFormState] = useState<CheckoutFormState>(INITIAL_FORM_STATE);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isErrorFeedback, setIsErrorFeedback] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackMessage(null);
    setIsErrorFeedback(false);

    const parsedInput = checkoutFormSchema.safeParse(formState);
    if (!parsedInput.success) {
      setIsErrorFeedback(true);
      setFeedbackMessage(
        getFirstZodErrorMessage(parsedInput.error, "Nao foi possivel validar os dados do checkout.")
      );
      return;
    }

    setFeedbackMessage(
      `Dados validados para checkout: ${parsedInput.data.address} | ${parsedInput.data.documentMasked}`
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout Flow (Base)</CardTitle>
        <CardDescription>
          Structural checkout form prepared for future application/infrastructure wiring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label htmlFor="address" className="text-sm font-medium text-slate-700">
              Delivery Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="Street, number, district"
              value={formState.address}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  address: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="document" className="text-sm font-medium text-slate-700">
              Customer Document
            </label>
            <input
              id="document"
              name="document"
              type="text"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="CPF/CNPJ"
              value={formState.document}
              onChange={(event) =>
                setFormState((currentState) => ({
                  ...currentState,
                  document: formatCpfCnpjMask(event.target.value),
                }))
              }
            />
          </div>

          {feedbackMessage ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                isErrorFeedback
                  ? "border border-red-200 bg-red-50 text-red-700"
                  : "border border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {feedbackMessage}
            </p>
          ) : null}

          <Button type="submit">Finalize (Structural)</Button>
        </form>
      </CardContent>
    </Card>
  );
}
