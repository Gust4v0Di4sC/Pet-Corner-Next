"use client";

import {
  readLandingProducts,
  readLandingServices,
  readLandingTestimonials,
  type LandingProductRecord,
  type LandingServiceRecord,
  type LandingTestimonialRecord,
} from "@/infrastructure/marketing/firebase-landing.adapter";

export type LandingProductView = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  image: string;
  badge: string;
};

export type LandingServiceView = {
  id: string;
  title: string;
  description: string;
  duration: string;
  iconKey: "scissors" | "syringe" | "taxi" | "hotel";
  iconClassName: string;
};

export type LandingTestimonialView = {
  id: string;
  content: string;
  author: string;
  role: string;
  rating: number;
};

export type LandingContentBundle = {
  products: LandingProductView[];
  services: LandingServiceView[];
  testimonials: LandingTestimonialView[];
};

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function sanitizePublicDescription(text: string, fallbackText: string): string {
  const normalizedText = text.trim();
  if (!normalizedText) {
    return fallbackText;
  }

  if (normalizedText.toLowerCase().includes("firebase")) {
    return fallbackText;
  }

  return normalizedText;
}

function mapProduct(record: LandingProductRecord): LandingProductView {
  const hasStock = record.quantity > 0;
  const safeCategory = record.category.trim() || "Loja";
  const defaultDescription = `Codigo ${record.code || "n/d"} | Estoque ${Math.max(
    Math.round(record.quantity),
    0
  )} unidade(s)`;
  const safeDescription = sanitizePublicDescription(record.description, defaultDescription);
  const normalizedImageUrl = record.imageUrl.trim();
  const safeImageUrl =
    normalizedImageUrl.startsWith("/") || /^https?:\/\//i.test(normalizedImageUrl)
      ? normalizedImageUrl
      : "/assets/pets.webp";

  return {
    id: record.id,
    category: safeCategory,
    title: record.name.trim(),
    description: safeDescription,
    price: BRL_FORMATTER.format(Math.max(record.price, 0)),
    image: safeImageUrl,
    badge: record.badge.trim() || (hasStock ? "Disponivel" : "Sob encomenda"),
  };
}

function categoryToIconKey(category: string): LandingServiceView["iconKey"] {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory.includes("consulta") || normalizedCategory.includes("veter")) {
    return "syringe";
  }

  if (normalizedCategory.includes("taxi")) {
    return "taxi";
  }

  if (normalizedCategory.includes("hotel") || normalizedCategory.includes("hosped")) {
    return "hotel";
  }

  return "scissors";
}

function iconClassNameByKey(iconKey: LandingServiceView["iconKey"]): string {
  if (iconKey === "syringe") return "bg-emerald-100 text-emerald-600";
  if (iconKey === "taxi") return "bg-amber-100 text-amber-700";
  return "bg-orange-100 text-[#fb8b24]";
}

function mapService(record: LandingServiceRecord): LandingServiceView {
  const iconKey = categoryToIconKey(record.category);
  const safeDuration = Math.max(Math.round(record.durationMinutes), 0);
  const durationLabel = safeDuration
    ? `Duracao ~ ${safeDuration} min`
    : "Duracao sob consulta";
  const safeDescription = sanitizePublicDescription(
    record.description,
    "Atendimento especializado com cuidado e carinho para o seu pet."
  );

  return {
    id: record.id,
    title: record.name.trim(),
    description: safeDescription,
    duration: durationLabel,
    iconKey,
    iconClassName: iconClassNameByKey(iconKey),
  };
}

function mapTestimonial(record: LandingTestimonialRecord): LandingTestimonialView {
  return {
    id: record.id,
    content: record.content.trim(),
    author: record.author.trim(),
    role: record.role.trim() || "Cliente Pet Corner",
    rating: Math.max(1, Math.min(Math.round(record.rating), 5)),
  };
}

function notEmptyText(value: string): boolean {
  return value.trim().length > 0;
}

export async function getLandingContentBundle(): Promise<LandingContentBundle> {
  const [productsResult, servicesResult, testimonialsResult] = await Promise.allSettled([
    readLandingProducts(),
    readLandingServices(),
    readLandingTestimonials(),
  ]);

  const products =
    productsResult.status === "fulfilled"
      ? productsResult.value
          .map(mapProduct)
          .filter((item) => notEmptyText(item.title) && notEmptyText(item.price))
      : [];

  const services =
    servicesResult.status === "fulfilled"
      ? servicesResult.value
          .map(mapService)
          .filter((item) => notEmptyText(item.title) && notEmptyText(item.description))
      : [];

  const testimonials =
    testimonialsResult.status === "fulfilled"
      ? testimonialsResult.value
          .map(mapTestimonial)
          .filter((item) => notEmptyText(item.author) && notEmptyText(item.content))
      : [];

  return {
    products,
    services,
    testimonials,
  };
}
