import type { ReactNode } from "react";

type Props = {
  fieldId: string;
  label: string;
  helperText?: string;
  children: ReactNode;
};

export function FormFieldFrame({ fieldId, label, helperText, children }: Props) {
  return (
    <div className="box-input">
      <label htmlFor={fieldId}>{label}</label>
      {children}
      {helperText ? <small className="form__helper">{helperText}</small> : null}
    </div>
  );
}
