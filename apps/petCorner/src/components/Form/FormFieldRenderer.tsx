import { AutocompleteField } from "./AutocompleteField";
import { DateField } from "./DateField";
import { FileUploadField } from "./FileUploadField";
import { MaskedField } from "./MaskedField";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";
import type { FormFieldRendererProps } from "./form.types";
import { getFieldMask } from "./form.utils";

export function FormFieldRenderer({
  field,
  value,
  disabled,
  onChange,
  onDateChange,
  onFileUpload,
}: FormFieldRendererProps) {
  if (field.type === "date") {
    return (
      <DateField
        field={field}
        value={value}
        disabled={disabled}
        onDateChange={onDateChange}
      />
    );
  }

  if (field.type === "file") {
    return (
      <FileUploadField
        field={field}
        value={value}
        disabled={disabled}
        onChange={onChange}
        onFileUpload={onFileUpload}
      />
    );
  }

  if (field.type === "select") {
    return (
      <SelectField
        field={field}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (field.type === "autocomplete") {
    return (
      <AutocompleteField
        field={field}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  if (getFieldMask(field)) {
    return (
      <MaskedField
        field={field}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }

  return (
    <TextField
      field={field}
      value={value}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
