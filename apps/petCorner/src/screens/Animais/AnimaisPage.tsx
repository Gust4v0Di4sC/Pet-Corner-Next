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
  parseNumberField,
} from "../../components/Records/record.utils";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useDog } from "../../hooks/useDog";
import type { Dog } from "../../types/dog";

const dogFields: RecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "age", label: "Idade", type: "number" },
  { name: "breed", label: "Raca", type: "text" },
  { name: "weight", label: "Peso", type: "number" },
];

const dogFormConfig: RecordFormConfig = {
  entityLabel: "animal",
  createTitle: "Novo animal",
  createSubmitLabel: "Adicionar animal",
  createSuccessMessage: "Animal cadastrado com sucesso!",
  editTitle: "Editar animal",
  editSubmitLabel: "Salvar alteracoes",
  editSuccessMessage: "Animal atualizado com sucesso!",
  deleteSuccessMessage: "Animal removido com sucesso!",
  fields: dogFields,
  initialValues: createInitialFormData(dogFields),
};

function formatDecimal(value: number, suffix = ""): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1).replace(".", ",")}${suffix}`;
}

function buildDogListGroup(dogs: Dog[]): RecordListGroup {
  return {
    title: "Lista de animais",
    subtitle: `${dogs.length} registros encontrados`,
    emptyMessage: "Nenhum animal registrado ate o momento.",
    items: [...dogs]
      .filter((dog): dog is Dog & { id: string } => typeof dog.id === "string" && Boolean(dog.id))
      .sort((left, right) => left.name.localeCompare(right.name))
      .map((dog) => ({
        id: dog.id,
        title: dog.name || "Animal sem nome",
        subtitle: dog.breed || "Raca nao informada",
        detail: `${formatDecimal(dog.age, " anos")} | ${formatDecimal(dog.weight, " kg")}`,
        badge: `${formatDecimal(dog.weight, " kg")}`,
      })),
  };
}

function getDogFormData(dog: Dog): RecordFormData {
  return {
    name: dog.name ?? "",
    age: String(dog.age ?? ""),
    breed: dog.breed ?? "",
    weight: String(dog.weight ?? ""),
  };
}

function buildDogPayload(formData: RecordFormData): Omit<Dog, "id"> {
  return {
    name: formData.name.trim(),
    age: parseNumberField(formData.age, "idade"),
    breed: formData.breed.trim(),
    weight: parseNumberField(formData.weight, "peso"),
  };
}

export default function AnimaisPage() {
  const { items, isLoading, create, update, remove } = useDog();

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="paw"
        title="Animais"
        subtitle="Gerencie os animais cadastrados no sistema"
        fillHeight
        contentClassName="record-management-shell"
      >
        <RecordManagementView
          listGroup={buildDogListGroup(items)}
          records={items}
          formConfig={dogFormConfig}
          isLoading={isLoading}
          backRoute={DASHBOARD_ROUTE}
          addAriaLabel="Adicionar novo animal"
          getFormData={getDogFormData}
          buildPayload={buildDogPayload}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      </Main>
    </AppShell>
  );
}
