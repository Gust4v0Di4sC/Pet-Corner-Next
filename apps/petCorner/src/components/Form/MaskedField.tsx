import { IMaskInput } from "react-imask";

import type { FormField, FormInputChangeHandler } from "./form.types";
import { FormFieldFrame } from "./FormFieldFrame";
import { createSyntheticInputChange, getFieldMask } from "./form.utils";

type Props = {
  field: FormField;
  value: string;
  disabled: boolean;
  onChange: FormInputChangeHandler;
};

export function MaskedField({ field, value, disabled, onChange }: Props) {
  const mask = getFieldMask(field);
  const isDisabled = disabled || field.disabled;

  if (!mask) {
    return null;
  }

  return (
    <FormFieldFrame fieldId={field.name} label={field.label} helperText={field.helperText}>
      <IMaskInput
        {...(mask as Record<string, unknown>)}
        id={field.name}
        name={field.name}
        value={value}
        placeholder={field.placeholder ?? (field.type === "phone" ? "(XX) XXXXX-XXXX" : "")}
        inputMode={
          field.inputMode ??
          (field.type === "number" ? "decimal" : field.type === "phone" ? "tel" : "text")
        }
        autoComplete={field.type === "phone" ? "tel" : "off"}
        disabled={isDisabled}
        required={field.required !== false}
        onAccept={(acceptedValue) => {
          onChange(createSyntheticInputChange(field.name, String(acceptedValue ?? "")));
        }}
      />
    </FormFieldFrame>
  );
}
