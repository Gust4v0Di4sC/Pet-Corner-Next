import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/Logo-Home.svg";
import { User, Wrench } from "@phosphor-icons/react/dist/ssr";
import { CartPanelDrawer } from "@/presentation/marketing/components/cart-panel-drawer";
import { CustomerNotificationDrawer } from "@/presentation/marketing/components/customer-notification-drawer";
import { GuestCartButton } from "@/presentation/marketing/components/guest-cart-button";
import { UserPanelDrawer } from "@/presentation/marketing/components/user-panel-drawer";
import { readServerCustomerSession } from "@/utils/auth/customer-session.server";

const menuLinks = [
  { href: "/#inicio", label: "Inicio" },
  { href: "/#produtos", label: "Produtos" },
  { href: "/#servicos", label: "Servicos" },
  { href: "/#contato", label: "Contato" },
];

export async function NavBar() {
  const session = await readServerCustomerSession();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/70 bg-[#1f2937]/95 backdrop-blur">
      <nav className="gridpet">
        <div className="gridpet-content flex h-20 items-center justify-between">
          <Link href="/" suppressHydrationWarning className="flex items-center gap-3">
            <Image
              src={logoImg}
              alt="PetCorner"
              width={128}
              height={34}
              className="h-8 w-auto"
              priority
            />
          </Link>

          <ul className="hidden items-center gap-2 text-sm font-medium text-slate-200 md:flex">
            {menuLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  suppressHydrationWarning
                  className="relative inline-flex items-center rounded-full px-4 py-2 text-slate-200 transition-colors duration-200 hover:text-white before:absolute before:inset-0 before:-z-10 before:scale-95 before:rounded-full before:border before:border-transparent before:bg-[#fb8b24]/15 before:opacity-0 before:shadow-[0_10px_25px_-18px_rgba(251,139,36,0.95)] before:transition before:duration-300 before:content-[''] hover:before:scale-100 hover:before:border-[#fb8b24]/55 hover:before:opacity-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            {session ? <CustomerNotificationDrawer customerId={session.customerId} /> : null}

            {session ? (
              <UserPanelDrawer name={session.name} email={session.email} />
            ) : (
              <Link
                href="/login?from=landing"
                suppressHydrationWarning
                aria-label="Perfil do cliente"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <Link
              href="/app-react"
              suppressHydrationWarning
              aria-label="Pagina administrativa"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-600 bg-[#273446] text-slate-100 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
            >
              <Wrench className="h-5 w-5" />
            </Link>

            {session ? (
              <CartPanelDrawer customerId={session.customerId} />
            ) : (
              <GuestCartButton />
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

