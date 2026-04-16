import { Timestamp } from "firebase/firestore";

import type { Client } from "../../types/client";
import type { Dog } from "../../types/dog";
import type { Product } from "../../types/product";
import { formatDateToString } from "../../utils/client/client.utils";
import type { DashboardDomainKey } from "./dashboard.types";

export type DashboardRecordFormData = Record<string, string>;
export type DashboardDomainRecord = Client | Dog | Product;

export type DashboardRecordFormField = {
  name: string;
  label: string;
  type: "text" | "email" | "phone" | "date" | "number";
};

export type DashboardRecordPayload = Omit<Client, "id"> | Omit<Dog, "id"> | Omit<Product, "id">;

export type DashboardRecordFormConfig = {
  entityLabel: string;
  createTitle: string;
  createSubmitLabel: string;
  createSuccessMessage: string;
  editTitle: string;
  editSubmitLabel: string;
  editSuccessMessage: string;
  deleteSuccessMessage: string;
  fields: DashboardRecordFormField[];
  initialValues: DashboardRecordFormData;
};

const clientFields: DashboardRecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "age", label: "Data de nascimento", type: "date" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Telefone", type: "phone" },
];

const dogFields: DashboardRecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "age", label: "Idade", type: "number" },
  { name: "breed", label: "Raca", type: "text" },
  { name: "weight", label: "Peso", type: "number" },
];

const productFields: DashboardRecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "price", label: "Preco", type: "number" },
  { name: "code", label: "Codigo", type: "text" },
  { name: "quantity", label: "Quantidade", type: "number" },
];

function buildInitialValues(fields: DashboardRecordFormField[]): DashboardRecordFormData {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

function parseNumberValue(value: string, label: string): number {
  const sanitizedValue = value.trim().replace(",", ".").replace(/[^\d.-]/g, "");
  const parsedValue = Number(sanitizedValue);

  if (!sanitizedValue || Number.isNaN(parsedValue)) {
    throw new Error(`Informe um valor valido para ${label.toLowerCase()}.`);
  }

  return parsedValue;
}

function parsePhoneValue(value: string): number {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Informe um telefone valido.");
  }

  return Number(digits);
}

function parseDateValue(value: string): Timestamp {
  const [day, month, year] = value.split("/").map(Number);
  const parsedDate = new Date(year, month - 1, day);

  if (!day || !month || !year || Number.isNaN(parsedDate.getTime())) {
    throw new Error("Informe uma data valida.");
  }

  return Timestamp.fromDate(parsedDate);
}

export function getDashboardRecordFormConfig(domain: DashboardDomainKey): DashboardRecordFormConfig {
  if (domain === "animais") {
    return {
      entityLabel: "animal",
      createTitle: "Novo animal",
      createSubmitLabel: "Adicionar animal",
      createSuccessMessage: "Animal cadastrado com sucesso!",
      editTitle: "Editar animal",
      editSubmitLabel: "Salvar alteracoes",
      editSuccessMessage: "Animal atualizado com sucesso!",
      deleteSuccessMessage: "Animal removido com sucesso!",
      fields: dogFields,
      initialValues: buildInitialValues(dogFields),
    };
  }

  if (domain === "itens") {
    return {
      entityLabel: "item",
      createTitle: "Novo item",
      createSubmitLabel: "Adicionar item",
      createSuccessMessage: "Item cadastrado com sucesso!",
      editTitle: "Editar item",
      editSubmitLabel: "Salvar alteracoes",
      editSuccessMessage: "Item atualizado com sucesso!",
      deleteSuccessMessage: "Item removido com sucesso!",
      fields: productFields,
      initialValues: buildInitialValues(productFields),
    };
  }

  return {
    entityLabel: "cliente",
    createTitle: "Novo cliente",
    createSubmitLabel: "Adicionar cliente",
    createSuccessMessage: "Cliente cadastrado com sucesso!",
    editTitle: "Editar cliente",
    editSubmitLabel: "Salvar alteracoes",
    editSuccessMessage: "Cliente atualizado com sucesso!",
    deleteSuccessMessage: "Cliente removido com sucesso!",
    fields: clientFields,
    initialValues: buildInitialValues(clientFields),
  };
}

export function getDashboardRecordFormData(
  domain: DashboardDomainKey,
  record: DashboardDomainRecord
): DashboardRecordFormData {
  if (domain === "animais") {
    const dogRecord = record as Dog;

    return {
      name: dogRecord.name ?? "",
      age: String(dogRecord.age ?? ""),
      breed: dogRecord.breed ?? "",
      weight: String(dogRecord.weight ?? ""),
    };
  }

  if (domain === "itens") {
    const productRecord = record as Product;

    return {
      name: productRecord.name ?? "",
      price: String(productRecord.price ?? ""),
      code: productRecord.code ?? "",
      quantity: String(productRecord.quantity ?? ""),
    };
  }

  const clientRecord = record as Client;

  return {
    name: clientRecord.name ?? "",
    age: formatDateToString(clientRecord.age.toDate()),
    email: clientRecord.email ?? "",
    phone: String(clientRecord.phone ?? ""),
  };
}

export function buildDashboardRecordPayload(
  domain: DashboardDomainKey,
  formData: DashboardRecordFormData
): DashboardRecordPayload {
  if (domain === "animais") {
    return {
      name: formData.name.trim(),
      age: parseNumberValue(formData.age, "idade"),
      breed: formData.breed.trim(),
      weight: parseNumberValue(formData.weight, "peso"),
    };
  }

  if (domain === "itens") {
    return {
      name: formData.name.trim(),
      price: parseNumberValue(formData.price, "preco"),
      code: formData.code.trim(),
      quantity: parseNumberValue(formData.quantity, "quantidade"),
    };
  }

  return {
    name: formData.name.trim(),
    age: parseDateValue(formData.age),
    email: formData.email.trim(),
    phone: parsePhoneValue(formData.phone),
  };
}
