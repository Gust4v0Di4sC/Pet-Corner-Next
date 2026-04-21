import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CartSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cart Summary</CardTitle>
        <CardDescription>Base scaffold for catalog/cart domain integration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm text-slate-700">
          <li>Kit Shampoo e hidratantes — R$ 18,90</li>
          <li>RaÃ§Ã£o para gatos filhotes — R$ 38,90</li>
        </ul>
        <p className="text-sm font-semibold text-slate-900">Subtotal: R$ 57,80</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login?next=/checkout">Login to Continue</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
