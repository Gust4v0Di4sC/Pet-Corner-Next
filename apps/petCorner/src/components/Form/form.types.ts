import type {
  ChangeEvent,
  ChangeEventHandler,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";

export type FormInputChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement>;
export type FormInputChangeHandler = ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;

export type FormFieldOption = {
  value: string;
  label: string;
};

export type FormFieldMask =
  | {
      mask: string;
    }
  | {
      mask: NumberConstructor;
      scale?: number;
      signed?: boolean;
      thousandsSeparator?: string;
      padFractionalZeros?: boolean;
      normalizeZeros?: boolean;
      radix?: string;
      mapToRadix?: string[];
      min?: number;
      max?: number;
    };

export type FormField = {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "date" | "number" | "select" | "autocomplete" | "file";
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  options?: FormFieldOption[];
  mask?: FormFieldMask;
  disabled?: boolean;
  helperText?: string;
  required?: boolean;
  accept?: string;
};

export type FormData = Record<string, string>;

export type FileUploadHandler = (params: {
  fieldName: string;
  file: File;
  currentValue: string;
}) => Promise<string>;

export type FormSubmitHandler = NonNullable<ComponentPropsWithoutRef<"form">["onSubmit"]>;

export type FormLayoutProps = {
  title: string;
  className?: string;
  onSubmit: FormSubmitHandler;
  children: ReactNode;
};

export type FormFieldsProps = {
  data: FormData;
  fields: FormField[];
  disabled?: boolean;
  onChange: FormInputChangeHandler;
  onFileUpload?: FileUploadHandler;
};

export type FormActionsProps = {
  submitLabel: string;
  backLabel?: string;
  resetLabel?: string;
  disabled?: boolean;
  onBack: () => void;
  onReset?: () => void;
};

export type FormSearchProps = {
  value: string;
  label?: string;
  placeholder?: string;
  tooltip?: string;
  onChange: (value: string) => void;
};

export type FormFieldRendererProps = {
  field: FormField;
  value: string;
  disabled: boolean;
  onChange: FormInputChangeHandler;
  onDateChange: (fieldName: string, date: Date | null) => void;
  onFileUpload?: FileUploadHandler;
};
