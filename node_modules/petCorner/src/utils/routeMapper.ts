// src/utils/routeMapper.ts
import type { RotaKey, ColumnType } from "../types/entities"

// Tipo para a configuração de cada rota
type RouteConfig<K extends RotaKey> = {
  schemaKey: K
  columns: ColumnType<K>[]
}

// Tipo para o mapeador completo
type RouteMapper = {
  [K in RotaKey as `/${K}`]: RouteConfig<K>
}

// Configuração tipada para cada rota
export const routeMapper: RouteMapper = {
  "/clientes": {
    schemaKey: "clientes",
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Data de Nascimento", accessor: "age" },
      { header: "Email", accessor: "email" },
      { header: "Telefone", accessor: "phone" },
    ] as ColumnType<"clientes">[]
  },
  "/caes": {
    schemaKey: "caes", 
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Idade", accessor: "age" },
      { header: "Raça", accessor: "breed" },
      { header: "Peso", accessor: "weight" },
    ] as ColumnType<"caes">[]
  },
  "/prods": {
    schemaKey: "prods",
    columns: [
      { header: "Nome", accessor: "name" },
      { header: "Preço", accessor: "price" },
      { header: "Código", accessor: "code" },
      { header: "Quantidade", accessor: "quantity" },
    ] as ColumnType<"prods">[]
  }
}

// Helper function para obter configuração com fallback tipado
export function getRouteConfig(path: string) {
  const config = (routeMapper as Record<string, RouteConfig<RotaKey>>)[path]
  return config || routeMapper["/clientes"]
}