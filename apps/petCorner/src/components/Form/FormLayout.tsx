import type { FormLayoutProps } from "./form.types";
import "./form.css";

export function FormLayout({
  title,
  titleId,
  className = "",
  onSubmit,
  children,
}: FormLayoutProps) {
  return (
    <form onSubmit={onSubmit} className={`form ${className}`.trim()}>
      <h2 id={titleId}>{title}</h2>
      {children}
    </form>
  );
}
