import type { DashboardDomainKey } from "./dashboard.types";

export const DASHBOARD_ROUTE = "/dashboard";

type DashboardDomainMeta = {
  key: DashboardDomainKey;
  route: string;
  icon: string;
  cardActionLabel: string;
  recordsTitle: string;
  recordsSubtitle: string;
};

const dashboardDomainMetaMap: Record<DashboardDomainKey, DashboardDomainMeta> = {
  clientes: {
    key: "clientes",
    route: "/clientes",
    icon: "users",
    cardActionLabel: "Abrir clientes",
    recordsTitle: "Clientes cadastrados",
    recordsSubtitle: "Lista completa com os clientes registrados no sistema",
  },
  animais: {
    key: "animais",
    route: "/caes",
    icon: "paw",
    cardActionLabel: "Abrir animais",
    recordsTitle: "Animais cadastrados",
    recordsSubtitle: "Lista completa com os animais registrados no sistema",
  },
  itens: {
    key: "itens",
    route: "/prods",
    icon: "medkit",
    cardActionLabel: "Abrir produtos",
    recordsTitle: "Produtos cadastrados",
    recordsSubtitle: "Lista completa com os produtos e estoque atual",
  },
};

export function getDashboardDomainMeta(domain: DashboardDomainKey): DashboardDomainMeta {
  return dashboardDomainMetaMap[domain];
}

export function getDashboardDomainRoute(domain: DashboardDomainKey): string {
  return dashboardDomainMetaMap[domain].route;
}
