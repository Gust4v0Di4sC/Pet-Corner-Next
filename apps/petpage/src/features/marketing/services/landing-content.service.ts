"use client";

import {
  readLandingProductById,
  readLandingProducts,
  readLandingServiceById,
  readLandingServices,
  readLandingTestimonials,
} from "@/features/marketing/services/firebase-landing.adapter";
import {
  LANDING_PRODUCTS_LIMIT,
  LANDING_SERVICES_LIMIT,
  sanitizeProducts,
  sanitizeServices,
  sanitizeTestimonials,
  type LandingContentBundle,
  type LandingProductView,
  type LandingServiceView,
  type LandingTestimonialView,
} from "@/features/marketing/services/landing-content.mapper";

export type {
  LandingContentBundle,
  LandingProductView,
  LandingServiceView,
  LandingTestimonialView,
};

type ListLandingOptions = {
  limitCount?: number;
};

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

  return {
    products:
      productsResult.status === "fulfilled" ? sanitizeProducts(productsResult.value) : [],
    services:
      servicesResult.status === "fulfilled" ? sanitizeServices(servicesResult.value) : [],
    testimonials:
      testimonialsResult.status === "fulfilled"
        ? sanitizeTestimonials(testimonialsResult.value)
        : [],
  };
}
