export type RecordFormOption = {
  value: string;
  label: string;
};

export type RecordFormMask =
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

export type RecordFormField = {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "date" | "number" | "select" | "autocomplete";
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  options?: RecordFormOption[];
  mask?: RecordFormMask;
  disabled?: boolean;
  helperText?: string;
};

export type RecordFormData = Record<string, string>;

export type RecordFormConfig = {
  entityLabel: string;
  createTitle: string;
  createSubmitLabel: string;
  createSuccessMessage: string;
  editTitle: string;
  editSubmitLabel: string;
  editSuccessMessage: string;
  deleteSuccessMessage: string;
  fields: RecordFormField[];
  resolveFields?: (
    data: RecordFormData,
    context: { isEditing: boolean }
  ) => RecordFormField[];
  mapInput?: (params: {
    name: string;
    value: string;
    currentData: RecordFormData;
    isEditing: boolean;
  }) => RecordFormData;
  initialValues: RecordFormData;
};

export type RecordListItem = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  badge: string;
};

export type RecordListGroup = {
  title: string;
  subtitle: string;
  emptyMessage: string;
  items: RecordListItem[];
};
