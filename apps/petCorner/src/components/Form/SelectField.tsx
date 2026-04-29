import type { FormField, FormInputChangeHandler } from "./form.types";
import { FormFieldFrame } from "./FormFieldFrame";

type Props = {
  field: FormField;
  value: string;
  disabled: boolean;
  onChange: FormInputChangeHandler;
};

export function SelectField({ field, value, disabled, onChange }: Props) {
  const isDisabled = disabled || field.disabled;

  return (
    <FormFieldFrame fieldId={field.name} label={field.label} helperText={field.helperText}>
      <select
        id={field.name}
        name={field.name}
        value={value}
        onChange={onChange}
        required={field.required !== false}
        disabled={isDisabled}
      >
        <option value="">{field.placeholder ?? `Selecione ${field.label.toLowerCase()}`}</option>
        {(field.options ?? []).map((option) => (
          <option key={`${field.name}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormFieldFrame>
  );
}
