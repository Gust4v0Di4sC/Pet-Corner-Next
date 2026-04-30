"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropdownMenuContextValue = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);

  if (!context) {
    throw new Error("DropdownMenu components must be used inside DropdownMenu.");
  }

  return context;
}

function DropdownMenuTrigger({
  asChild = false,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement<{ onClick?: React.MouseEventHandler }>;
}) {
  const { setOpen } = useDropdownMenu();
  const onClick: React.MouseEventHandler = (event) => {
    children.props.onClick?.(event);
    setOpen((current) => !current);
  };

  if (asChild) {
    return React.cloneElement(children, { onClick });
  }

  return (
    <Button type="button" onClick={onClick}>
      {children}
    </Button>
  );
}

function DropdownMenuContent({ className, ...props }: React.ComponentProps<"div">) {
  const { open } = useDropdownMenu();

  if (!open) {
    return null;
  }

  return (
    <div
      data-slot="dropdown-menu-content"
      className={cn("absolute right-0 z-50 mt-2 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md", className)}
      {...props}
    />
  );
}

function DropdownMenuItem({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="dropdown-menu-item"
      className={cn("flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger };
