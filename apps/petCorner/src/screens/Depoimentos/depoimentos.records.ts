import type {
  RecordFormConfig,
  RecordFormData,
  RecordFormField,
  RecordFormOption,
  RecordListGroup,
} from "../../components/Records/record.types";
import {
  createInitialFormData,
  parseNumberField,
} from "../../components/Records/record.utils";
import type { Testimonial } from "../../types/testimonial";

const testimonialStatusOptions: RecordFormOption[] = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
];

const testimonialRatingOptions: RecordFormOption[] = [
  { value: "5", label: "5 estrelas" },
  { value: "4", label: "4 estrelas" },
  { value: "3", label: "3 estrelas" },
  { value: "2", label: "2 estrelas" },
  { value: "1", label: "1 estrela" },
];

const testimonialFields: RecordFormField[] = [
  { name: "author", label: "Autor", type: "text", placeholder: "Ex.: Mariana Souza" },
  { name: "role", label: "Descricao", type: "text", placeholder: "Ex.: Tutora da Luna" },
  {
    name: "content",
    label: "Depoimento",
    type: "text",
    placeholder: "Ex.: Atendimento impecavel e equipe muito cuidadosa.",
  },
  {
    name: "rating",
    label: "Avaliacao",
    type: "select",
    options: testimonialRatingOptions,
  },
  {
    name: "isActive",
    label: "Status",
    type: "select",
    options: testimonialStatusOptions,
  },
];

export const testimonialFormConfig: RecordFormConfig = {
  entityLabel: "depoimento",
  createTitle: "Novo depoimento",
  createSubmitLabel: "Adicionar depoimento",
  createSuccessMessage: "Depoimento cadastrado com sucesso!",
  editTitle: "Editar depoimento",
  editSubmitLabel: "Salvar alteracoes",
  editSuccessMessage: "Depoimento atualizado com sucesso!",
  deleteSuccessMessage: "Depoimento removido com sucesso!",
  fields: testimonialFields,
  initialValues: {
    ...createInitialFormData(testimonialFields),
    rating: "5",
    isActive: "active",
  },
};

const numberFormatter = new Intl.NumberFormat("pt-BR");

function clampRating(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function getRatingBadge(rating: number): string {
  const safeRating = clampRating(rating);
  return `${safeRating} estrela${safeRating === 1 ? "" : "s"}`;
}

export function buildTestimonialListGroup(testimonials: Testimonial[]): RecordListGroup {
  return {
    title: "Lista de depoimentos",
    subtitle: `${numberFormatter.format(testimonials.length)} depoimentos cadastrados`,
    emptyMessage: "Nenhum depoimento cadastrado ate o momento.",
    items: [...testimonials]
      .filter(
        (testimonial): testimonial is Testimonial & { id: string } =>
          typeof testimonial.id === "string" && Boolean(testimonial.id)
      )
      .sort((left, right) => left.author.localeCompare(right.author))
      .map((testimonial) => ({
        id: testimonial.id,
        title: testimonial.author || "Autor nao informado",
        subtitle: testimonial.role || "Descricao nao informada",
        detail: testimonial.content || "Conteudo nao informado",
        badge: testimonial.isActive
          ? `Ativo | ${getRatingBadge(testimonial.rating)}`
          : `Inativo | ${getRatingBadge(testimonial.rating)}`,
      })),
  };
}

export function getTestimonialFormData(testimonial: Testimonial): RecordFormData {
  return {
    author: testimonial.author ?? "",
    role: testimonial.role ?? "",
    content: testimonial.content ?? "",
    rating: String(clampRating(testimonial.rating ?? 5)),
    isActive: testimonial.isActive ? "active" : "inactive",
  };
}

export function buildTestimonialPayload(formData: RecordFormData): Omit<Testimonial, "id"> {
  return {
    author: formData.author.trim(),
    role: formData.role.trim(),
    content: formData.content.trim(),
    rating: clampRating(parseNumberField(formData.rating, "avaliacao")),
    isActive: formData.isActive === "active",
  };
}
