import type { ColumnType, RotaKey } from "../types/entities";

type RouteConfig<K extends RotaKey> = {
  schemaKey: K;
  columns: ColumnType<K>[];
};

type RouteMapper = {
  [K in RotaKey as `/${K}`]: RouteConfig<K>;
};

export const routeMapper: RouteMapper = {
  "/clientes": {
    schemaKey: "clientes",
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Data de Nascimento", accessor: "age" },
      { header: "Email", accessor: "email" },
      { header: "Telefone", accessor: "phone" },
      { header: "Endereco", accessor: "address" },
    ],
  },
  "/caes": {
    schemaKey: "caes",
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Idade", accessor: "age" },
      { header: "Raca", accessor: "breed" },
      { header: "Peso", accessor: "weight" },
    ],
  },
  "/prods": {
    schemaKey: "prods",
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Preco", accessor: "price" },
      { header: "Codigo", accessor: "code" },
      { header: "Quantidade", accessor: "quantity" },
    ],
  },
  "/servicos": {
    schemaKey: "servicos",
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Categoria", accessor: "category" },
      { header: "Preco", accessor: "price" },
      { header: "Duracao", accessor: "durationMinutes" },
      { header: "Ativo", accessor: "isActive" },
    ],
  },
};

export function getRouteConfig(path: string) {
  const config = (routeMapper as Record<string, RouteConfig<RotaKey>>)[path];
  return config || routeMapper["/clientes"];
}
