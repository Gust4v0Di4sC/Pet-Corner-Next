import type { ReactNode } from "react";

import "./app-shell.css";
import ChatAssistant from "../chat/ChatAssistant";
import Logo from "../Templates/Logo";
import Nav from "../Templates/Nav";

type Props = {
  logoSrc: string;
  children: ReactNode;
  className?: string;
  chatFabPlacement?: "default" | "resource-fab";
};

export default function AppShell({
  logoSrc,
  children,
  className = "app",
  chatFabPlacement = "default",
}: Props) {
  return (
    <div className={className}>
      <Logo src={logoSrc} />
      <Nav />
      {children}
      <ChatAssistant placement={chatFabPlacement} />
    </div>
  );
}
