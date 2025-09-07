import type { Metadata } from "next";
import { Montserrat_Alternates } from "next/font/google";
import "./globals.css";
import { AosInit } from "./_components/aos-init";



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
    "Pet Corner é a plataforma completa para gerenciar clientes, pets e produtos com integração ao Firebase. Simples, rápida e feita para pet shops e clínicas veterinárias.",
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
        url: "/assets/image.png", // coloque uma imagem dentro de public/
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
      "Solução completa para pet shops e clínicas veterinárias, com Firebase e Next.js.",
    creator: "@seu_twitter",
    images: ["/assets/image.png"],
  },
  icons: {
    icon: "/assets/favicon.svg",
    apple: "/assets/apple-touch-icon.png",
  },
  manifest: "/assets/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${montserratAlternates.className}  antialiased`}
      >
        {children}
        <AosInit/>
      </body>
    </html>
  );
}
