import type { ReactNode } from "react";

import Nav from "../Templates/Nav";
import Footer from "../Templates/Footer";
import Logo from "../Templates/Logo";

type Props = {
  logoSrc: string;
  children: ReactNode;
  className?: string; // permite manter "app" se você quiser
};

export default function AppShell({ logoSrc, children, className = "app" }: Props) {
  return (
    <div className={className}>
      <Logo src={logoSrc} />
      <Nav />
      {children}
      <Footer />
    </div>
  );
}
