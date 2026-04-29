import type { FormField, FormInputChangeHandler } from "./form.types";
import { FormFieldFrame } from "./FormFieldFrame";

type Props = {
  field: FormField;
  value: string;
  disabled: boolean;
  onChange: FormInputChangeHandler;
};

export function TextField({ field, value, disabled, onChange }: Props) {
  const isDisabled = disabled || field.disabled;

  return (
    <FormFieldFrame fieldId={field.name} label={field.label} helperText={field.helperText}>
      <input
        id={field.name}
        name={field.name}
        type={field.type === "email" ? "email" : "text"}
        inputMode={
          field.inputMode ??
          (field.type === "email" ? "email" : field.type === "number" ? "decimal" : "text")
        }
        value={value}
        onChange={onChange}
        required={field.required !== false}
        placeholder={field.placeholder ?? (field.type === "email" ? "email@exemplo.com" : "")}
        autoComplete={field.type === "email" ? "email" : "off"}
        disabled={isDisabled}
      />
    </FormFieldFrame>
  );
}
