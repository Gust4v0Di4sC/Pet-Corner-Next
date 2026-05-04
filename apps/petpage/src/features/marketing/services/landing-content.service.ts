"use client";

import {
  readLandingProductById,
  readLandingProducts,
  readLandingServiceById,
  readLandingServices,
  readLandingTestimonials,
  type LandingProductRecord,
  type LandingServiceRecord,
  type LandingTestimonialRecord,
} from "@/features/marketing/services/firebase-landing.adapter";
import productFallback from "@/assets/fallbackproduct.png";

export type LandingProductView = {
  id: string;
  category: string;
  title: string;
  description: string;
  price: string;
  code: string;
  quantity: number;
  image: string;
  badge: string;
};

export type LandingServiceView = {
  id: string;
  title: string;
  category: string;
  description: string;
  duration: string;
  price: string;
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

const LANDING_PRODUCTS_LIMIT = 24;
const LANDING_SERVICES_LIMIT = 20;

type ListLandingOptions = {
  limitCount?: number;
};

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
      : productFallback.src;

  return {
    id: record.id,
    category: safeCategory,
    title: record.name.trim(),
    description: safeDescription,
    price: BRL_FORMATTER.format(Math.max(record.price, 0)),
    code: record.code.trim(),
    quantity: Math.max(Math.round(record.quantity), 0),
    image: safeImageUrl,
    badge: record.badge.trim() || (hasStock ? "Disponível" : "Sob encomenda"),
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
    ? `Duração ~ ${safeDuration} min`
    : "Duração sob consulta";
  const safeDescription = sanitizePublicDescription(
    record.description,
    "Atendimento especializado com cuidado e carinho para o seu pet."
  );

  return {
    id: record.id,
    title: record.name.trim(),
    category: record.category.trim() || "Serviços",
    description: safeDescription,
    duration: durationLabel,
    price: BRL_FORMATTER.format(Math.max(record.price, 0)),
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

function sanitizeProducts(records: LandingProductRecord[]): LandingProductView[] {
  return records
    .map(mapProduct)
    .filter((item) => notEmptyText(item.title) && notEmptyText(item.price));
}

function sanitizeServices(records: LandingServiceRecord[]): LandingServiceView[] {
  return records
    .map(mapService)
    .filter((item) => notEmptyText(item.title) && notEmptyText(item.description));
}

export async function listLandingProducts(
  options: ListLandingOptions = {}
): Promise<LandingProductView[]> {
  const records = await readLandingProducts({
    limitCount: options.limitCount,
  });

  return sanitizeProducts(records);
}

export async function listLandingServices(
  options: ListLandingOptions = {}
): Promise<LandingServiceView[]> {
  const records = await readLandingServices({
    limitCount: options.limitCount,
  });

  return sanitizeServices(records);
}

export async function getLandingProductById(productId: string): Promise<LandingProductView | null> {
  const record = await readLandingProductById(productId);
  if (!record) {
    return null;
  }

  const [mappedProduct] = sanitizeProducts([record]);
  return mappedProduct || null;
}

export async function getLandingServiceById(serviceId: string): Promise<LandingServiceView | null> {
  const record = await readLandingServiceById(serviceId);
  if (!record) {
    return null;
  }

  const [mappedService] = sanitizeServices([record]);
  return mappedService || null;
}

export async function getLandingContentBundle(): Promise<LandingContentBundle> {
  const [productsResult, servicesResult, testimonialsResult] = await Promise.allSettled([
    readLandingProducts({ limitCount: LANDING_PRODUCTS_LIMIT }),
    readLandingServices({ limitCount: LANDING_SERVICES_LIMIT }),
    readLandingTestimonials(),
  ]);

  const products =
    productsResult.status === "fulfilled" ? sanitizeProducts(productsResult.value) : [];

  const services =
    servicesResult.status === "fulfilled" ? sanitizeServices(servicesResult.value) : [];

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
