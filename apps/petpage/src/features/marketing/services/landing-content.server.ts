import "server-only";
import { unstable_cache } from "next/cache";

import {
  readLandingProductByIdServer,
  readLandingProductsServer,
  readLandingServiceByIdServer,
  readLandingServicesServer,
  readLandingTestimonialsServer,
} from "@/features/marketing/services/firebase-landing.server";
import {
  LANDING_PRODUCTS_LIMIT,
  LANDING_SERVICES_LIMIT,
  sanitizeProducts,
  sanitizeServices,
  sanitizeTestimonials,
  type LandingContentBundle,
  type LandingProductView,
  type LandingServiceView,
} from "@/features/marketing/services/landing-content.mapper";

type ListLandingOptions = {
  limitCount?: number;
};

const cachedProducts = unstable_cache(readLandingProductsServer, ["public-products"], {
  revalidate: 60,
  tags: ["catalog", "products"],
});
const cachedServices = unstable_cache(readLandingServicesServer, ["public-services"], {
  revalidate: 60,
  tags: ["catalog", "services"],
});
const cachedTestimonials = unstable_cache(readLandingTestimonialsServer, ["public-testimonials"], {
  revalidate: 60,
  tags: ["testimonials"],
});

export async function listLandingProductsServer(
  options: ListLandingOptions = {}
): Promise<LandingProductView[]> {
  const records = await cachedProducts({
    limitCount: options.limitCount,
  });

  return sanitizeProducts(records);
}

export async function listLandingServicesServer(
  options: ListLandingOptions = {}
): Promise<LandingServiceView[]> {
  const records = await cachedServices({
    limitCount: options.limitCount,
  });

  return sanitizeServices(records);
}

export async function getLandingProductByIdServer(
  productId: string
): Promise<LandingProductView | null> {
  const record = await readLandingProductByIdServer(productId);
  if (!record) {
    return null;
  }

  const [mappedProduct] = sanitizeProducts([record]);
  return mappedProduct || null;
}

export async function getLandingServiceByIdServer(
  serviceId: string
): Promise<LandingServiceView | null> {
  const record = await readLandingServiceByIdServer(serviceId);
  if (!record) {
    return null;
  }

  const [mappedService] = sanitizeServices([record]);
  return mappedService || null;
}

export async function getLandingContentBundleServer(): Promise<LandingContentBundle> {
  const [productsResult, servicesResult, testimonialsResult] = await Promise.allSettled([
    cachedProducts({ limitCount: LANDING_PRODUCTS_LIMIT }),
    cachedServices({ limitCount: LANDING_SERVICES_LIMIT }),
    cachedTestimonials(),
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
