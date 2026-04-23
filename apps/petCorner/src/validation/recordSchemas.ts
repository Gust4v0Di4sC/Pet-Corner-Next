import { z } from "zod";
import { MANUAL_BREED_OPTION } from "../utils/dogs/dogOptions";
import {
  collapseWhitespace,
  digitsOnly,
  normalizeEmail,
  normalizeProductCode,
  normalizeStateCode,
  normalizeZipCode,
  parseLocaleNumber,
} from "./inputSanitizers";

const requiredText = (fieldLabel: string) =>
  z
    .string()
    .trim()
    .transform((value) => collapseWhitespace(value))
    .refine((value) => value.length > 0, {
      message: `Informe ${fieldLabel}.`,
    });

const brDateSchema = z
  .string()
  .trim()
  .refine((value) => /^\d{2}\/\d{2}\/\d{4}$/.test(value), {
    message: "Informe a data no formato dd/mm/aaaa.",
  })
  .refine((value) => {
    const [day, month, year] = value.split("/").map(Number);
    const parsedDate = new Date(year, month - 1, day);
    return (
      Number.isInteger(day) &&
      Number.isInteger(month) &&
      Number.isInteger(year) &&
      !Number.isNaN(parsedDate.getTime()) &&
      parsedDate.getDate() === day &&
      parsedDate.getMonth() === month - 1 &&
      parsedDate.getFullYear() === year
    );
  }, "Informe uma data valida.");

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => digitsOnly(value))
  .refine((value) => value.length >= 10 && value.length <= 11, {
    message: "Informe um telefone valido.",
  });

const zipCodeSchema = z
  .string()
  .trim()
  .transform((value) => normalizeZipCode(value))
  .refine((value) => value.length === 9, {
    message: "Informe um CEP valido.",
  });

const stateSchema = z
  .string()
  .trim()
  .transform((value) => normalizeStateCode(value))
  .refine((value) => value.length === 2, {
    message: "Informe a UF com 2 letras.",
  });

function numericFieldSchema(config: {
  fieldLabel: string;
  minValue: number;
  maxValue: number;
  integerOnly?: boolean;
}) {
  return z
    .string()
    .trim()
    .min(1, `Informe ${config.fieldLabel}.`)
    .transform((value) => parseLocaleNumber(value))
    .refine((value) => Number.isFinite(value), {
      message: `Informe ${config.fieldLabel} valido.`,
    })
    .refine((value) => value >= config.minValue, {
      message: `${config.fieldLabel[0].toUpperCase()}${config.fieldLabel.slice(1)} deve ser maior ou igual a ${config.minValue}.`,
    })
    .refine((value) => value <= config.maxValue, {
      message: `${config.fieldLabel[0].toUpperCase()}${config.fieldLabel.slice(1)} deve ser menor ou igual a ${config.maxValue}.`,
    })
    .refine((value) => (config.integerOnly ? Number.isInteger(value) : true), {
      message: `${config.fieldLabel[0].toUpperCase()}${config.fieldLabel.slice(1)} deve ser inteiro.`,
    });
}

export const clientRecordSchema = z
  .object({
    name: requiredText("o nome do cliente"),
    age: brDateSchema,
    email: z
      .string()
      .trim()
      .min(1, "Informe o email do cliente.")
      .email("Informe um email valido.")
      .transform((value) => normalizeEmail(value)),
    phone: phoneSchema,
    zipCode: zipCodeSchema,
    street: requiredText("a rua"),
    number: requiredText("o numero"),
    district: requiredText("o bairro"),
    city: requiredText("a cidade"),
    state: stateSchema,
    complement: z
      .string()
      .trim()
      .transform((value) => collapseWhitespace(value)),
    address: z.string().trim().optional().default(""),
  })
  .transform((value) => ({
    name: value.name,
    age: value.age,
    email: value.email,
    phone: value.phone,
    zipCode: value.zipCode,
    street: value.street,
    number: value.number,
    district: value.district,
    city: value.city,
    state: value.state,
    complement: value.complement,
    address: collapseWhitespace(value.address),
  }));

export const dogRecordSchema = z
  .object({
    name: requiredText("o nome do animal"),
    animalType: requiredText("o tipo do animal"),
    breedSelection: z.string().trim(),
    breed: z.string().trim(),
    age: numericFieldSchema({
      fieldLabel: "a idade",
      minValue: 0,
      maxValue: 99,
      integerOnly: true,
    }),
    weight: numericFieldSchema({
      fieldLabel: "o peso",
      minValue: 0,
      maxValue: 999.9,
    }),
  })
  .superRefine((value, context) => {
    const selectedBreed = collapseWhitespace(value.breedSelection);
    if (selectedBreed === MANUAL_BREED_OPTION) {
      if (!collapseWhitespace(value.breed)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["breed"],
          message: "Informe a raca do animal.",
        });
      }
      return;
    }

    if (!selectedBreed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["breedSelection"],
        message: "Selecione a raca do animal.",
      });
    }
  })
  .transform((value) => {
    const selectedBreed = collapseWhitespace(value.breedSelection);
    const breed =
      selectedBreed === MANUAL_BREED_OPTION
        ? collapseWhitespace(value.breed)
        : selectedBreed;

    return {
      name: value.name,
      animalType: value.animalType,
      age: value.age,
      breed,
      weight: value.weight,
    };
  });

export const productRecordSchema = z
  .object({
    name: requiredText("o nome do produto"),
    price: numericFieldSchema({
      fieldLabel: "o preco",
      minValue: 0,
      maxValue: 999999.99,
    }),
    code: z
      .string()
      .trim()
      .min(1, "Informe o codigo do produto.")
      .transform((value) => normalizeProductCode(value)),
    imageUrl: z
      .string()
      .trim()
      .optional()
      .default("")
      .refine((value) => !value || value.startsWith("/") || /^https?:\/\//i.test(value), {
        message: "Informe uma URL de imagem valida.",
      }),
    quantity: numericFieldSchema({
      fieldLabel: "a quantidade",
      minValue: 0,
      maxValue: 999999,
      integerOnly: true,
    }),
  })
  .transform((value) => ({
    name: value.name,
    price: value.price,
    code: value.code,
    imageUrl: value.imageUrl,
    quantity: value.quantity,
  }));

export const serviceRecordSchema = z
  .object({
    name: requiredText("o nome do servico"),
    category: requiredText("a categoria do servico"),
    description: requiredText("a descricao do servico"),
    durationMinutes: numericFieldSchema({
      fieldLabel: "a duracao",
      minValue: 5,
      maxValue: 1440,
      integerOnly: true,
    }),
    price: numericFieldSchema({
      fieldLabel: "o preco",
      minValue: 0,
      maxValue: 999999.99,
    }),
    isActive: z
      .string()
      .trim()
      .refine((value) => value === "active" || value === "inactive", {
        message: "Selecione um status valido.",
      }),
  })
  .transform((value) => ({
    name: value.name,
    category: value.category,
    description: value.description,
    durationMinutes: value.durationMinutes,
    price: value.price,
    isActive: value.isActive === "active",
  }));
