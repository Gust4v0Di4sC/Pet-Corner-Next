import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, PackageSearch } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutSuccessCartSync } from "@/features/cart-checkout/components/checkout-success-cart-sync";
import { NavBar } from "@/features/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/lib/auth/customer-session.server";

export async function CheckoutSuccessPage() {
  const session = await readServerCustomerSession();

  if (!session) {
    redirect("/login?next=/checkout/sucesso");
  }

  return (
    <PageShell tone="success">
      <CheckoutSuccessCartSync />
      <NavBar />
      <div className="mx-auto flex w-full max-w-[920px] px-4 py-10 md:py-16">
        <Card className="w-full rounded-[2rem] border border-slate-700/90 bg-[#0f1722] py-0 text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
          <CardContent className="space-y-6 p-7 md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold leading-tight text-slate-100 md:text-6xl">
                Pagamento recebido
              </h1>
              <p className="max-w-2xl text-base text-slate-300 md:text-lg">
                O Stripe confirmou o pagamento. Seu pedido sera criado pelo webhook e aparecera em
                Rastreamento assim que o processamento terminar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
              >
                <Link href="/rastreamento">
                  <PackageSearch className="h-4 w-4" />
                  Ver rastreamento
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-slate-600 bg-transparent px-5 text-sm font-semibold text-slate-100 hover:border-[#fb8b24] hover:bg-slate-900"
              >
                <Link href="/">Voltar para a loja</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}

