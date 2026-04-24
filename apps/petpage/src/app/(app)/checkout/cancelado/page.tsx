import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { readServerCustomerSession } from "@/utils/auth/customer-session.server";

export default async function CheckoutCanceledPage() {
  const session = await readServerCustomerSession();

  if (!session) {
    redirect("/login?next=/checkout/cancelado");
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_85%_15%,rgba(251,139,36,0.16),transparent_40%),linear-gradient(145deg,#4a2d03_0%,#3b2608_55%,#2d1b06_100%)]">
      <NavBar />
      <div className="mx-auto flex w-full max-w-[920px] px-4 py-10 md:py-16">
        <Card className="w-full rounded-[2rem] border border-slate-700/90 bg-[#0f1722] py-0 text-slate-100 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.95)]">
          <CardContent className="space-y-6 p-7 md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#fb8b24]/40 bg-[#fb8b24]/15 text-[#fb8b24]">
              <ShoppingCart className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold leading-tight text-slate-100 md:text-6xl">
                Checkout cancelado
              </h1>
              <p className="max-w-2xl text-base text-slate-300 md:text-lg">
                O pagamento nao foi concluido. Seu carrinho foi preservado para voce revisar ou
                tentar novamente.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                asChild
                className="h-11 rounded-full bg-[#fb8b24] px-5 text-sm font-semibold text-white hover:bg-[#ef7e14]"
              >
                <Link href="/checkout">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao checkout
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-full border-slate-600 bg-transparent px-5 text-sm font-semibold text-slate-100 hover:border-[#fb8b24] hover:bg-slate-900"
              >
                <Link href="/cart">Ver carrinho</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
