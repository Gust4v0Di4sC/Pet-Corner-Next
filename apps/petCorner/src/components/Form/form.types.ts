import type {
  ChangeEvent,
  ChangeEventHandler,
  ComponentPropsWithoutRef,
} from "react";

import type { RecordFormField } from "../Records/record.types";

export type FormInputChangeEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement>;
export type FormInputChangeHandler = ChangeEventHandler<HTMLInputElement | HTMLSelectElement>;

export type FileUploadHandler = (params: {
  fieldName: string;
  file: File;
  currentValue: string;
}) => Promise<string>;

export type FormSubmitHandler = NonNullable<ComponentPropsWithoutRef<"form">["onSubmit"]>;

export type FormProps = {
  data: Record<string, string>;
  fields: RecordFormField[];
  mode: "create" | "edit" | "exclude";
  handleInput: FormInputChangeHandler;
  handleFileUpload?: FileUploadHandler;
  handleSubmit: FormSubmitHandler;
  handleBack: () => void;
  handleResetFields?: () => void;
  searchName?: string;
  setSearchName?: (value: string) => void;
  textTitle: string;
  textButton: string;
  className?: string;
  backButtonLabel?: string;
  resetButtonLabel?: string;
  disableActions?: boolean;
};

export type FormFieldRendererProps = {
  field: RecordFormField;
  value: string;
  disableActions: boolean;
  onChange: FormInputChangeHandler;
  onDateChange: (fieldName: string, date: Date | null) => void;
  onFileUpload?: FileUploadHandler;
};
