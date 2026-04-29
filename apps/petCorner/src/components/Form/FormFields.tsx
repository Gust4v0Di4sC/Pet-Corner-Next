import { FormFieldRenderer } from "./FormFieldRenderer";
import type { FormFieldsProps } from "./form.types";
import { createSyntheticInputChange, formatDateToString } from "./form.utils";

export function FormFields({
  fields,
  data,
  disabled = false,
  onChange,
  onFileUpload,
}: FormFieldsProps) {
  const handleDateChange = (fieldName: string, date: Date | null) => {
    onChange(
      createSyntheticInputChange(fieldName, date ? formatDateToString(date) : "")
    );
  };

  return (
    <>
      {fields.map((field) => (
        <FormFieldRenderer
          key={field.name}
          field={field}
          value={data[field.name] ?? ""}
          disabled={disabled}
          onChange={onChange}
          onDateChange={handleDateChange}
          onFileUpload={onFileUpload}
        />
      ))}
    </>
  );
}
