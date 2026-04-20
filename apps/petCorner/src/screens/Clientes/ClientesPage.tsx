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
  parsePhoneField,
} from "../../components/Records/record.utils";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useClient } from "../../hooks/useClient";
import type { Client } from "../../types/client";
import { formatDateToString } from "../../utils/client/client.utils";

const clientFields: RecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "age", label: "Data de nascimento", type: "date" },
  { name: "email", label: "E-mail", type: "email" },
  { name: "phone", label: "Telefone", type: "phone" },
  { name: "address", label: "Endereço", type: "text", placeholder: "Rua, número, bairro" },
];

const clientFormConfig: RecordFormConfig = {
  entityLabel: "cliente",
  createTitle: "Novo cliente",
  createSubmitLabel: "Adicionar cliente",
  createSuccessMessage: "Cliente cadastrado com sucesso!",
  editTitle: "Editar cliente",
  editSubmitLabel: "Salvar alterações",
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

function buildClientListGroup(clients: Client[]): RecordListGroup {
  return {
    title: "Lista de clientes",
    subtitle: `${numberFormatter.format(clients.length)} registros encontrados`,
    emptyMessage: "Nenhum cliente registrado até o momento.",
    items: [...clients]
      .filter((client) => client.id)
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((client) => ({
        id: client.id,
        title: client.name || "Cliente sem nome",
        subtitle: client.email || "Sem e-mail cadastrado",
        detail: `Nascimento ${formatDateToString(client.age.toDate())} | Telefone ${String(
          client.phone || "-"
        )} | Endereço ${client.address || "-"}`,
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
    address: client.address ?? "",
  };
}

function buildClientPayload(formData: RecordFormData): Omit<Client, "id"> {
  return {
    name: formData.name.trim(),
    age: parseDateField(formData.age),
    email: formData.email.trim(),
    phone: parsePhoneField(formData.phone),
    address: formData.address.trim(),
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
