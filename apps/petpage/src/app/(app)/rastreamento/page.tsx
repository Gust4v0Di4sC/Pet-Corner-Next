import { redirect } from "next/navigation";
import { NavBar } from "@/presentation/marketing/components/nav-bar";
import { OrderTrackingPage } from "@/presentation/cart-checkout/components/order-tracking-page";
import { readServerCustomerSession } from "@/utils/auth/customer-session.server";

export default async function TrackingPage() {
  const session = await readServerCustomerSession();

  if (!session) {
    redirect("/login?next=/rastreamento");
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_85%_15%,rgba(251,139,36,0.18),transparent_40%),linear-gradient(145deg,#4a2d03_0%,#3b2608_55%,#2d1b06_100%)]">
      <NavBar />
      <div className="mx-auto w-full max-w-[1320px] px-4 py-8 md:py-10">
        <OrderTrackingPage customerId={session.customerId} />
      </div>
    </main>
  );
}
