import type { FormLayoutProps } from "./form.types";
import "./form.css";

export function FormLayout({
  title,
  className = "",
  onSubmit,
  children,
}: FormLayoutProps) {
  return (
    <form onSubmit={onSubmit} className={`form ${className}`.trim()}>
      <h2>{title}</h2>
      {children}
    </form>
  );
}
