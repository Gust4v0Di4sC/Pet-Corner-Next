import type {
  RecordFormConfig,
  RecordFormData,
  RecordFormField,
  RecordListGroup,
} from "../../components/Records/record.types";
import { createInitialFormData } from "../../components/Records/record.utils";
import type { Dog } from "../../types/dog";
import {
  ANIMAL_TYPE_OPTIONS,
  DEFAULT_ANIMAL_TYPE,
  getBreedOptionsForAnimalType,
  isCommonBreedForAnimalType,
  MANUAL_BREED_OPTION,
} from "../../utils/dogs/dogOptions";
import { dogRecordSchema } from "../../validation/recordSchemas";

const dogFields: RecordFormField[] = [
  {
    name: "name",
    label: "Nome",
    type: "text",
    placeholder: "Ex.: Thor",
  },
  {
    name: "animalType",
    label: "Tipo do animal",
    type: "select",
    placeholder: "Selecione o tipo do animal",
    options: ANIMAL_TYPE_OPTIONS,
  },
  {
    name: "breed",
    label: "Raca",
    type: "select",
    placeholder: "Selecione a raca mais comum",
    options: [],
  },
  {
    name: "age",
    label: "Idade",
    type: "number",
    placeholder: "Ex.: 4",
    inputMode: "numeric",
    mask: {
      mask: Number,
      scale: 0,
      signed: false,
      min: 0,
      max: 99,
      thousandsSeparator: "",
      normalizeZeros: true,
      radix: ",",
      mapToRadix: ["."],
    },
  },
  {
    name: "weight",
    label: "Peso",
    type: "number",
    placeholder: "Ex.: 12,5",
    inputMode: "decimal",
    mask: {
      mask: Number,
      scale: 1,
      signed: false,
      min: 0,
      max: 999.9,
      thousandsSeparator: "",
      normalizeZeros: true,
      padFractionalZeros: false,
      radix: ",",
      mapToRadix: ["."],
    },
  },
];

export const dogFormConfig: RecordFormConfig = {
  entityLabel: "animal",
  createTitle: "Novo animal",
  createSubmitLabel: "Adicionar animal",
  createSuccessMessage: "Animal cadastrado com sucesso!",
  editTitle: "Editar animal",
  editSubmitLabel: "Salvar alteracoes",
  editSuccessMessage: "Animal atualizado com sucesso!",
  deleteSuccessMessage: "Animal removido com sucesso!",
  fields: dogFields,
  resolveFields: (formData) =>
    dogFields.map((field) =>
      field.name === "breed"
        ? {
            ...field,
            name: formData.breedSelection === MANUAL_BREED_OPTION ? "breed" : "breedSelection",
            type: formData.breedSelection === MANUAL_BREED_OPTION ? "text" : "select",
            placeholder:
              formData.breedSelection === MANUAL_BREED_OPTION
                ? "Digite a raca manualmente"
                : "Selecione a raca mais comum",
            options:
              formData.breedSelection === MANUAL_BREED_OPTION
                ? undefined
                : getBreedOptionsForAnimalType(formData.animalType ?? ""),
            disabled: !formData.animalType,
          }
        : field
    ),
  mapInput: ({ name, value, currentData }) => {
    if (name === "animalType" && currentData.animalType !== value) {
      return { ...currentData, animalType: value, breed: "", breedSelection: "" };
    }

    if (name === "breedSelection") {
      return {
        ...currentData,
        breedSelection: value,
        breed: value === MANUAL_BREED_OPTION ? "" : value,
      };
    }

    return { ...currentData, [name]: value };
  },
  initialValues: {
    ...createInitialFormData(dogFields),
    breedSelection: "",
  },
};

function formatDecimal(value: number, suffix = ""): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1).replace(".", ",")}${suffix}`;
}

function formatAge(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  if (Number.isInteger(safeValue)) {
    return `${safeValue.toFixed(0)} ${safeValue === 1 ? "ano" : "anos"}`;
  }

  return `${safeValue.toFixed(1).replace(".", ",")} anos`;
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

export function buildDogListGroup(dogs: Dog[]): RecordListGroup {
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
        subtitle: `${dog.animalType || DEFAULT_ANIMAL_TYPE} | ${dog.breed || "Raca nao informada"}`,
        detail: `${formatAge(dog.age)} | ${formatDecimal(dog.weight, " kg")}`,
        badge: `${formatDecimal(dog.weight, " kg")}`,
      })),
  };
}

export function getDogFormData(dog: Dog): RecordFormData {
  const breed = dog.breed ?? "";
  const animalType = dog.animalType ?? DEFAULT_ANIMAL_TYPE;
  const isCommonBreed = isCommonBreedForAnimalType(animalType, breed);

  return {
    name: dog.name ?? "",
    animalType,
    age: formatNumberForInput(dog.age ?? 0, 0),
    breed,
    breedSelection: isCommonBreed ? breed : MANUAL_BREED_OPTION,
    weight: formatNumberForInput(dog.weight ?? 0, 1),
  };
}

export function buildDogPayload(formData: RecordFormData): Omit<Dog, "id"> {
  return dogRecordSchema.parse(formData);
}
