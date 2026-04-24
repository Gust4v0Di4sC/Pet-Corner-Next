import type { Metadata } from "next";
import { Montserrat_Alternates, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AosInit } from "@/presentation/shared/components/aos-init";
import { AppQueryProvider } from "@/presentation/shared/components/app-query-provider";
import { FloatingSupportActions } from "@/presentation/support/components/floating-support-actions";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'], // Quais subsets de caracteres você quer incluir (ex: latim)
  weight: ['400', '700'], // Quais pesos da fonte você quer usar (ex: regular e negrito)
  // Ou se você quiser todos os pesos disponíveis:
  // weight: 'variable',
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  metadataBase: new URL("https://pet-corner.vercel.app"), // ajuste para a URL real do seu deploy
  title: {
    default: "Pet Corner 🐾 | Cuidando do seu melhor amigo",
    template: "%s | Pet Corner",
  },
  description:
    "Pet Corner é a plataforma completa para gerenciar clientes, pets e produtos. Simples, rápida e feita para pet shops e clínicas veterinárias.",
  keywords: [
    "Pet Shop",
    "Pets",
    "Cachorros",
    "Gatos",
    "Produtos Pet",
    "Gerenciamento",
    "Clínica Veterinária",
  ],
  authors: [{ name: "Gustavo Dias", url: "https://github.com/Gust4v0Di4sC" }],
  creator: "Gustavo Dias",
  publisher: "Pet Corner",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://pet-corner.vercel.app",
    title: "Pet Corner 🐾 | Cuidando do seu melhor amigo",
    description:
      "Plataforma moderna para gestão de pets, clientes e produtos em clínicas e pet shops.",
    siteName: "Pet Corner",
    images: [
      {
        url: "/app-react/logo512.png",
        width: 1200,
        height: 630,
        alt: "Pet Corner - Gestão para seu Pet Shop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pet Corner 🐾 | Gestão de Pets e Produtos",
    description:
      "Solução completa para pet shops e clínicas veterinárias.",
    creator: "@seu_twitter",
    images: ["/app-react/logo512.png"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={cn("font-sans", geist.variable)}
    >
      <body
        className={`${montserratAlternates.className}  antialiased`}
      >
        <AppQueryProvider>
          {children}
          <FloatingSupportActions />
          <AosInit/>
        </AppQueryProvider>
      </body>
    </html>
  );
}

