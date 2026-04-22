import Image from "next/image";
import logoImg from "@/assets/Logo-Home.svg";
import {
  FacebookLogo,
  InstagramLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: InstagramLogo },
  { label: "Facebook", href: "https://facebook.com", icon: FacebookLogo },
  { label: "Youtube", href: "https://youtube.com", icon: YoutubeLogo },
];

export function Footer() {
  return (
    <footer id="contato" className="bg-[#1f2937] text-slate-200">
      <div className="container mx-auto grid gap-12 px-4 py-14 md:grid-cols-[1.1fr_1fr_1fr]">
        <div className="space-y-4">
          <Image
            src={logoImg}
            alt="PetCorner"
            width={132}
            height={34}
            className="h-8 w-auto"
          />
          <p className="max-w-sm text-sm leading-relaxed text-slate-300">
            Cuidando do seu melhor amigo com amor e dedicacao. Produtos e
            servicos pensados para quem realmente ama animais.
          </p>
          <div className="flex items-center gap-2">
            {socialLinks.map((social) => {
              const Icon = social.icon;

              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  suppressHydrationWarning
                  className="rounded-full border border-slate-600 bg-[#273446] p-2 transition hover:border-[#fb8b24] hover:text-[#fb8b24]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Contato</h3>
          <p className="text-sm text-slate-300">contato@petcorner.com</p>
          <p className="text-sm text-slate-300">(67) 9 9999-0000</p>
          <p className="text-sm text-slate-300">Rua das Patas, 42</p>
          <p className="text-sm text-slate-300">Campo Grande / MS</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Horario</h3>
          <p className="text-sm text-slate-300">Seg a Sex - 8h as 19h</p>
          <p className="text-sm text-slate-300">Sabado - 9h as 17h</p>
          <p className="text-sm text-slate-300">Domingo - Fechado</p>
        </div>
      </div>

      <div className="border-t border-slate-600 py-5">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 text-xs text-slate-400">
          <p>Copyright 2026 Pet Corner. Feito com carinho pelos pets.</p>
          <p>CNPJ 00.000.000/0001-00</p>
        </div>
      </div>
    </footer>
  );
}

