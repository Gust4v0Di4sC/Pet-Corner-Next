import { z } from "zod";
import {
  collapseWhitespace,
  digitsOnly,
  normalizeStateCode,
  normalizeZipCode,
  parseLocaleDecimal,
} from "@/lib/validation/input-sanitizers";

const requiredText = (message: string) =>
  z
    .string()
    .trim()
    .min(1, message)
    .transform((value) => collapseWhitespace(value));

export function createPetProfileSchema(manualBreedOption: string) {
  return z
    .object({
      name: requiredText("Informe o nome do pet."),
      animalType: requiredText("Informe o tipo do animal."),
      breedSelection: z.string().trim(),
      breed: z.string().trim(),
      age: z
        .string()
        .trim()
        .min(1, "Informe a idade.")
        .transform((value) => Number.parseInt(digitsOnly(value), 10))
        .refine((value) => Number.isInteger(value), {
          message: "Informe uma idade valida.",
        })
        .refine((value) => value > 0, {
          message: "A idade deve ser maior que zero.",
        })
        .refine((value) => value <= 99, {
          message: "A idade deve ser menor ou igual a 99.",
        }),
      weight: z
        .string()
        .trim()
        .min(1, "Informe o peso.")
        .transform((value) => parseLocaleDecimal(value))
        .refine((value) => Number.isFinite(value), {
          message: "Informe um peso valido.",
        })
        .refine((value) => value >= 0, {
          message: "O peso nao pode ser negativo.",
        })
        .refine((value) => value <= 999.9, {
          message: "O peso deve ser menor ou igual a 999,9 kg.",
        }),
    })
    .superRefine((value, context) => {
      const selectedBreed = collapseWhitespace(value.breedSelection);
      if (selectedBreed === manualBreedOption) {
        if (!collapseWhitespace(value.breed)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["breed"],
            message: "Informe a raca do pet.",
          });
        }
        return;
      }

      if (!selectedBreed) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breedSelection"],
          message: "Selecione a raca do pet.",
        });
      }
    })
    .transform((value) => {
      const selectedBreed = collapseWhitespace(value.breedSelection);
      const breed =
        selectedBreed === manualBreedOption
          ? collapseWhitespace(value.breed)
          : selectedBreed;

      return {
        name: value.name,
        animalType: value.animalType,
        breed,
        age: value.age,
        weight: Math.round(value.weight * 10) / 10,
      };
    });
}

export const customerAddressSchema = z
  .object({
    zipCode: z
      .string()
      .trim()
      .min(1, "Informe o CEP.")
      .transform((value) => normalizeZipCode(value))
      .refine((value) => value.length === 9, {
        message: "Informe um CEP valido.",
      }),
    street: requiredText("Informe a rua."),
    number: requiredText("Informe o numero."),
    district: requiredText("Informe o bairro."),
    city: requiredText("Informe a cidade."),
    state: z
      .string()
      .trim()
      .min(1, "Informe o estado.")
      .transform((value) => normalizeStateCode(value))
      .refine((value) => value.length === 2, {
        message: "Informe a UF com 2 letras.",
      }),
    complement: z
      .string()
      .trim()
      .optional()
      .default("")
      .transform((value) => collapseWhitespace(value)),
  })
  .transform((value) => ({
    zipCode: value.zipCode,
    street: value.street,
    number: value.number,
    district: value.district,
    city: value.city,
    state: value.state,
    complement: value.complement,
  }));

export type CustomerPetProfileInput = z.infer<ReturnType<typeof createPetProfileSchema>>;
export type CustomerAddressInput = z.infer<typeof customerAddressSchema>;
