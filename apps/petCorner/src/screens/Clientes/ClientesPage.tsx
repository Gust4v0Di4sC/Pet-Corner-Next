import logoimg from "../../assets/Logo.svg";
import RecordManagementView from "../../components/Records/RecordManagementView";
import type {
  RecordFormConfig,
  RecordFormData,
  RecordFormField,
  RecordListGroup,
} from "../../components/Records/record.types";
import {
  createInitialFormData,
  parseDateField,
} from "../../components/Records/record.utils";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useClient } from "../../hooks/useClient";
import type { Client } from "../../types/client";
import { clientRecordSchema } from "../../validation/recordSchemas";
import { buildClientAddressLabel, formatDateToString } from "../../utils/client/client.utils";

const clientFields: RecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "age", label: "Data de nascimento", type: "date" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Telefone", type: "phone" },
  { name: "zipCode", label: "CEP", type: "text", placeholder: "00000-000", mask: { mask: "00000-000" } },
  { name: "street", label: "Rua", type: "text", placeholder: "Rua das Patas" },
  { name: "number", label: "Numero", type: "text", placeholder: "42" },
  { name: "district", label: "Bairro", type: "text", placeholder: "Centro" },
  { name: "city", label: "Cidade", type: "text", placeholder: "Campo Grande" },
  { name: "state", label: "Estado", type: "text", placeholder: "MS" },
  {
    name: "complement",
    label: "Complemento",
    type: "text",
    placeholder: "Apartamento, referencia, etc.",
  },
];

const clientFormConfig: RecordFormConfig = {
  entityLabel: "cliente",
  createTitle: "Novo cliente",
  createSubmitLabel: "Adicionar cliente",
  createSuccessMessage: "Cliente cadastrado com sucesso!",
  editTitle: "Editar cliente",
  editSubmitLabel: "Salvar alteracoes",
  editSuccessMessage: "Cliente atualizado com sucesso!",
  deleteSuccessMessage: "Cliente removido com sucesso!",
  fields: clientFields,
  initialValues: createInitialFormData(clientFields),
};

const numberFormatter = new Intl.NumberFormat("pt-BR");

function getClientAgeInYears(client: Client): number {
  const birthDate = client.age.toDate();
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (beforeBirthday) {
    years -= 1;
  }

  return Math.max(years, 0);
}

function resolveClientAddress(client: Client): string {
  return (
    buildClientAddressLabel({
      zipCode: client.zipCode,
      street: client.street,
      number: client.number,
      district: client.district,
      city: client.city,
      state: client.state,
      complement: client.complement,
    }) ||
    client.address ||
    "-"
  );
}

function buildClientListGroup(clients: Client[]): RecordListGroup {
  return {
    title: "Lista de clientes",
    subtitle: `${numberFormatter.format(clients.length)} registros encontrados`,
    emptyMessage: "Nenhum cliente registrado ate o momento.",
    items: [...clients]
      .filter((client) => client.id)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((client) => ({
        id: client.id,
        title: client.name || "Cliente sem nome",
        subtitle: client.email || "Sem e-mail cadastrado",
        detail: `Nascimento ${formatDateToString(client.age.toDate())} | Telefone ${String(
          client.phone || "-"
        )} | Endereco ${resolveClientAddress(client)}`,
        badge: `${getClientAgeInYears(client)} anos`,
      })),
  };
}

function getClientFormData(client: Client): RecordFormData {
  return {
    name: client.name ?? "",
    age: formatDateToString(client.age.toDate()),
    email: client.email ?? "",
    phone: String(client.phone ?? ""),
    zipCode: client.zipCode ?? "",
    street: client.street ?? "",
    number: client.number ?? "",
    district: client.district ?? "",
    city: client.city ?? "",
    state: client.state ?? "",
    complement: client.complement ?? "",
    address: client.address ?? "",
  };
}

function buildClientPayload(formData: RecordFormData): Omit<Client, "id"> {
  const parsedInput = clientRecordSchema.parse(formData);
  const zipCode = parsedInput.zipCode;
  const street = parsedInput.street;
  const number = parsedInput.number;
  const district = parsedInput.district;
  const city = parsedInput.city;
  const state = parsedInput.state;
  const complement = parsedInput.complement;
  const legacyAddress = parsedInput.address;

  return {
    name: parsedInput.name,
    age: parseDateField(parsedInput.age),
    email: parsedInput.email,
    phone: Number(parsedInput.phone),
    zipCode,
    street,
    number,
    district,
    city,
    state,
    complement,
    address:
      buildClientAddressLabel({
        zipCode,
        street,
        number,
        district,
        city,
        state,
        complement,
      }) || legacyAddress,
  };
}

export default function ClientesPage() {
  const { items, isLoading, create, update, remove } = useClient("clientes");

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="users"
        title="Clientes"
        subtitle="Gerencie os clientes cadastrados no sistema"
        fillHeight
        contentClassName="record-management-shell"
      >
        <RecordManagementView
          listGroup={buildClientListGroup(items)}
          records={items}
          formConfig={clientFormConfig}
          isLoading={isLoading}
          listPageSize={4}
          backRoute={DASHBOARD_ROUTE}
          addAriaLabel="Adicionar novo cliente"
          getFormData={getClientFormData}
          buildPayload={buildClientPayload}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      </Main>
    </AppShell>
  );
}
