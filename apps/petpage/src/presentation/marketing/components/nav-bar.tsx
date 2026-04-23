import Image from "next/image";
import Link from "next/link";
import logoImg from "@/assets/Logo-Home.svg";
import { User, Wrench } from "@phosphor-icons/react/dist/ssr";
import { ShoppingCartSimple } from "@phosphor-icons/react/dist/ssr";
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
      <nav className="container mx-auto flex h-20 items-center justify-between px-4">
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

        <ul className="hidden items-center gap-7 text-sm font-medium text-slate-200 md:flex">
          {menuLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                suppressHydrationWarning
                className="transition hover:text-[#fb8b24]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
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

          <Link
            href="/cart"
            suppressHydrationWarning
            className="inline-flex items-center gap-2 rounded-full bg-[#fb8b24] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-12px_rgba(251,139,36,0.9)] transition hover:bg-[#ef7e14]"
          >
            <ShoppingCartSimple className="h-4 w-4" />
            Carrinho
          </Link>
        </div>
      </nav>
    </header>
  );
}

