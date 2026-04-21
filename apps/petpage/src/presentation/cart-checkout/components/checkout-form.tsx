import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CheckoutForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout Flow (Base)</CardTitle>
        <CardDescription>
          Structural checkout form prepared for future application/infrastructure wiring.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
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
            />
          </div>
          <Button type="button">Finalize (Structural)</Button>
        </form>
      </CardContent>
    </Card>
  );
}
