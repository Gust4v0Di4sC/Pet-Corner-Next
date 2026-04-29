import type {
  FormData as BaseFormData,
  FormField,
  FormFieldMask,
  FormFieldOption,
} from "../Form/form.types";

export type RecordFormOption = FormFieldOption;
export type RecordFormMask = FormFieldMask;
export type RecordFormField = FormField;
export type RecordFormData = BaseFormData;

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
