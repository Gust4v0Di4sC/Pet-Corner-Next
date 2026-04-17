export type RecordFormField = {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "date" | "number";
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
