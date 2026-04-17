import type { DashboardDomainKey } from "./dashboard.types";

export const DASHBOARD_ROUTE = "/dashboard";
export const CLIENTS_ROUTE = "/clientes";
export const ANIMALS_ROUTE = "/caes";
export const PRODUCTS_ROUTE = "/prods";

type DashboardDomainMeta = {
  key: DashboardDomainKey;
  route: string;
  icon: string;
  cardActionLabel: string;
};

const dashboardDomainMetaMap: Record<DashboardDomainKey, DashboardDomainMeta> = {
  clientes: {
    key: "clientes",
    route: CLIENTS_ROUTE,
    icon: "users",
    cardActionLabel: "Abrir clientes",
  },
  animais: {
    key: "animais",
    route: ANIMALS_ROUTE,
    icon: "paw",
    cardActionLabel: "Abrir animais",
  },
  itens: {
    key: "itens",
    route: PRODUCTS_ROUTE,
    icon: "medkit",
    cardActionLabel: "Abrir produtos",
  },
};

export function getDashboardDomainMeta(domain: DashboardDomainKey): DashboardDomainMeta {
  return dashboardDomainMetaMap[domain];
}

export function getDashboardDomainRoute(domain: DashboardDomainKey): string {
  return dashboardDomainMetaMap[domain].route;
}
