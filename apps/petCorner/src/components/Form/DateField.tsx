import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import type { FormField } from "./form.types";
import { FormFieldFrame } from "./FormFieldFrame";
import { parseDateFromString } from "./form.utils";

type Props = {
  field: FormField;
  value: string;
  disabled: boolean;
  onDateChange: (fieldName: string, date: Date | null) => void;
};

export function DateField({ field, value, disabled, onDateChange }: Props) {
  const isDisabled = disabled || field.disabled;

  return (
    <FormFieldFrame fieldId={field.name} label={field.label} helperText={field.helperText}>
      <DatePicker
        selected={parseDateFromString(value)}
        onChange={(date) => onDateChange(field.name, date)}
        dateFormat="dd/MM/yyyy"
        placeholderText={field.placeholder ?? "DD/MM/AAAA"}
        showYearDropdown
        showMonthDropdown
        dropdownMode="select"
        className="form-control"
        id={field.name}
        name={field.name}
        autoComplete="off"
        disabled={isDisabled}
      />
    </FormFieldFrame>
  );
}
