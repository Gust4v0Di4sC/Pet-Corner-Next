import type { RecordFormOption } from "../../components/Records/record.types";

export const DEFAULT_ANIMAL_TYPE = "Cachorro";
export const MANUAL_BREED_OPTION = "Outro";
const DEFAULT_BREED_VALUES = ["Sem raça definida"];

const BREEDS_BY_ANIMAL_TYPE: Record<string, string[]> = {
  Cachorro: [
    "Sem raça definida",
    "Shih Tzu",
    "Yorkshire Terrier",
    "Poodle",
    "Golden Retriever",
    "Labrador Retriever",
    "Bulldog Frances",
    "Spitz Alemao",
    "Pinscher",
    "Rottweiler",
    "Beagle",
    "Pastor Alemao",
  ],
  Gato: [
    "Sem raça definida",
    "Siames",
    "Persa",
    "Maine Coon",
    "Angora",
    "Bengal",
    "Ragdoll",
    "Sphynx",
    "British Shorthair",
  ],
  Coelho: [
    "Sem raça definida",
    "Mini Lop",
    "Lionhead",
    "Netherland Dwarf",
    "Rex",
    "Californiano",
    "Angora",
    "Hotot",
    "Flemish Giant",
  ],
  Ave: [
    "Calopsita",
    "Periquito Australiano",
    "Canario",
    "Agapornis",
    "Ring Neck",
    "Papagaio",
    "Cacatua",
    "Diamante Mandarim",
  ],
  Hamster: [
    "Sirio",
    "Anão Russo",
    "Roborovski",
    "Chines",
  ],
  "Porquinho-da-india": [
    "Abissinio",
    "Peruano",
    "Sheltie",
    "Americano",
    "Coronet",
    "Teddy",
  ],
  Tartaruga: [
    "Tigre-d'agua",
    "Jabuti-piranga",
    "Jabuti-tinga",
    "Tartaruga-mordedora",
  ],
  Peixe: [
    "Betta",
    "Guppy",
    "Neon",
    "Kinguio",
    "Acara-bandeira",
    "Molinesia",
    "Platy",
    "Corydora",
    "Oscar",
  ],
};

function toOptions(values: string[]): RecordFormOption[] {
  return values.map((value) => ({
    value,
    label: value,
  }));
}

export const ANIMAL_TYPE_OPTIONS = toOptions([
  "Cachorro",
  "Gato",
  "Coelho",
  "Ave",
  "Hamster",
  "Porquinho-da-india",
  "Tartaruga",
  "Peixe",
]);

function getBreedValuesForAnimalType(animalType: string): string[] {
  const normalizedAnimalType = animalType.trim();

  if (!normalizedAnimalType) {
    return [];
  }

  return [...(BREEDS_BY_ANIMAL_TYPE[normalizedAnimalType] ?? DEFAULT_BREED_VALUES)];
}

export function getBreedOptionsForAnimalType(animalType: string): RecordFormOption[] {
  const baseValues = getBreedValuesForAnimalType(animalType);

  if (!baseValues.length) {
    return [];
  }

  return toOptions([...baseValues, MANUAL_BREED_OPTION]);
}

export function isCommonBreedForAnimalType(animalType: string, breed: string): boolean {
  const normalizedBreed = breed.trim();

  if (!normalizedBreed) {
    return false;
  }

  return getBreedValuesForAnimalType(animalType).includes(normalizedBreed);
}
