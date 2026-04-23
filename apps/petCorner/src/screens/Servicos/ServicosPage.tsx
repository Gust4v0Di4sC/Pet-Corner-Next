import logoimg from "../../assets/Logo.svg";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import RecordManagementView from "../../components/Records/RecordManagementView";
import type {
  RecordFormConfig,
  RecordFormData,
  RecordFormField,
  RecordListGroup,
  RecordFormOption,
} from "../../components/Records/record.types";
import {
  createInitialFormData,
} from "../../components/Records/record.utils";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useServices } from "../../hooks/useServices";
import type { PetService } from "../../types/petService";
import { serviceRecordSchema } from "../../validation/recordSchemas";

const serviceCategoryOptions: RecordFormOption[] = [
  { value: "banho_tosa", label: "Banho e tosa" },
  { value: "consulta_veterinaria", label: "Consulta veterinaria" },
  { value: "taxi_pet", label: "Taxi pet" },
  { value: "hospedagem", label: "Hospedagem" },
  { value: "adestramento", label: "Adestramento" },
  { value: "outros", label: "Outros" },
];

const serviceStatusOptions: RecordFormOption[] = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

const serviceCategoryLabelMap = Object.fromEntries(
  serviceCategoryOptions.map((option) => [option.value, option.label])
) as Record<string, string>;

const serviceFields: RecordFormField[] = [
  { name: "name", label: "Nome do servico", type: "text", placeholder: "Ex.: Banho e tosa premium" },
  {
    name: "category",
    label: "Categoria",
    type: "select",
    placeholder: "Selecione a categoria",
    options: serviceCategoryOptions,
  },
  {
    name: "description",
    label: "Descricao",
    type: "text",
    placeholder: "Ex.: Inclui banho, secagem, corte de unhas e limpeza de ouvidos",
  },
  {
    name: "durationMinutes",
    label: "Duracao (min)",
    type: "number",
    placeholder: "Ex.: 60",
    inputMode: "numeric",
    mask: {
      mask: Number,
      scale: 0,
      signed: false,
      min: 5,
      max: 1440,
      thousandsSeparator: "",
      normalizeZeros: true,
      radix: ",",
      mapToRadix: ["."],
    },
  },
  {
    name: "price",
    label: "Preco",
    type: "number",
    placeholder: "Ex.: 89,90",
    inputMode: "decimal",
    mask: {
      mask: Number,
      scale: 2,
      signed: false,
      min: 0,
      max: 999999.99,
      thousandsSeparator: "",
      normalizeZeros: true,
      padFractionalZeros: false,
      radix: ",",
      mapToRadix: ["."],
    },
  },
  {
    name: "isActive",
    label: "Status",
    type: "select",
    options: serviceStatusOptions,
  },
];

const serviceFormConfig: RecordFormConfig = {
  entityLabel: "servico",
  createTitle: "Novo servico",
  createSubmitLabel: "Adicionar servico",
  createSuccessMessage: "Servico cadastrado com sucesso!",
  editTitle: "Editar servico",
  editSubmitLabel: "Salvar alteracoes",
  editSuccessMessage: "Servico atualizado com sucesso!",
  deleteSuccessMessage: "Servico removido com sucesso!",
  fields: serviceFields,
  initialValues: {
    ...createInitialFormData(serviceFields),
    isActive: "active",
  },
};

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatDuration(durationMinutes: number): string {
  const safeDuration = Math.max(0, Math.round(durationMinutes));
  const hours = Math.floor(safeDuration / 60);
  const minutes = safeDuration % 60;

  if (!hours) {
    return `${minutes} min`;
  }

  if (!minutes) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}min`;
}

function formatNumberForInput(value: number, scale: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (scale === 0) {
    return String(Math.round(value));
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(scale).replace(".", ",");
}

function buildServiceListGroup(services: PetService[]): RecordListGroup {
  return {
    title: "Lista de servicos",
    subtitle: `${numberFormatter.format(services.length)} servicos cadastrados`,
    emptyMessage: "Nenhum servico cadastrado ate o momento.",
    items: [...services]
      .filter(
        (service): service is PetService & { id: string } =>
          typeof service.id === "string" && Boolean(service.id)
      )
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((service) => {
        const categoryLabel =
          serviceCategoryLabelMap[service.category] ?? service.category ?? "";

        return {
          id: service.id,
          title: service.name || "Servico sem nome",
          subtitle: `${categoryLabel || "Categoria nao informada"} | ${
            service.description || "Descricao nao informada"
          }`,
          detail: `${formatDuration(service.durationMinutes)} | ${currencyFormatter.format(
            service.price
          )}`,
          badge: service.isActive ? "Ativo" : "Inativo",
        };
      }),
  };
}

function getServiceFormData(service: PetService): RecordFormData {
  return {
    name: service.name ?? "",
    category: service.category ?? "",
    description: service.description ?? "",
    durationMinutes: formatNumberForInput(service.durationMinutes ?? 0, 0),
    price: formatNumberForInput(service.price ?? 0, 2),
    isActive: service.isActive ? "active" : "inactive",
  };
}

function buildServicePayload(formData: RecordFormData): Omit<PetService, "id"> {
  return serviceRecordSchema.parse(formData);
}

export default function ServicosPage() {
  const { items, isLoading, create, update, remove } = useServices();

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="scissors"
        title="Servicos"
        subtitle="Gerencie os servicos oferecidos pelo petshop"
        fillHeight
        contentClassName="record-management-shell"
      >
        <RecordManagementView
          listGroup={buildServiceListGroup(items)}
          records={items}
          formConfig={serviceFormConfig}
          isLoading={isLoading}
          listPageSize={4}
          backRoute={DASHBOARD_ROUTE}
          addAriaLabel="Adicionar novo servico"
          getFormData={getServiceFormData}
          buildPayload={buildServicePayload}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      </Main>
    </AppShell>
  );
}
