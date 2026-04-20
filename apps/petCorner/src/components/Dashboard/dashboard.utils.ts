import type { Client } from "../../types/client";
import type { Dog } from "../../types/dog";
import type { Product } from "../../types/product";
import type {
  DashboardChartData,
  DashboardChartSection,
  DashboardSummaryCardData,
} from "./dashboard.types";

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDecimal(value: number, suffix = ""): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1).replace(".", ",")}${suffix}`;
}

function average(values: number[]): number {
  if (!values.length) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function getClientAgeInYears(client: Client): number {
  const birthDate = client.age.toDate();
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());

  if (beforeBirthday) {
    years -= 1;
  }

  return Math.max(years, 0);
}

function getTotalStock(products: Product[]): number {
  return products.reduce((total, product) => total + Math.max(product.quantity, 0), 0);
}

function getClientAgeChart(clients: Client[]): DashboardChartData[] {
  const ranges = [
    { label: "0 a 17 anos", min: 0, max: 17 },
    { label: "18 a 29 anos", min: 18, max: 29 },
    { label: "30 a 44 anos", min: 30, max: 44 },
    { label: "45 anos ou mais", min: 45, max: Number.POSITIVE_INFINITY },
  ];

  return ranges.map((range, index) => {
    const count = clients.filter((client) => {
      const age = getClientAgeInYears(client);
      return age >= range.min && age <= range.max;
    }).length;

    return {
      label: range.label,
      value: count,
      helper: count === 1 ? "1 cliente" : `${formatNumber(count)} clientes`,
      accent: index % 2 === 0 ? "#FB8B24" : "#E36414",
    };
  });
}

function getOverviewChart(
  clients: Client[],
  dogs: Dog[],
  products: Product[]
): DashboardChartData[] {
  return [
    {
      label: "Clientes",
      value: clients.length,
      helper: `${formatNumber(clients.length)} cadastrados`,
      accent: "#FB8B24",
    },
    {
      label: "Animais",
      value: dogs.length,
      helper: `${formatNumber(dogs.length)} registrados`,
      accent: "#E36414",
    },
    {
      label: "Produtos",
      value: products.length,
      helper: `${formatNumber(products.length)} no catálogo`,
      accent: "#1A2F3A",
    },
  ];
}

function getInventoryChart(products: Product[]): DashboardChartData[] {
  return [...products]
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5)
    .map((product, index) => ({
      label: product.name || `Produto ${index + 1}`,
      value: Math.max(product.quantity, 0),
      helper: `Código ${product.code || "sem código"}`,
      accent: index % 2 === 0 ? "#FB8B24" : "#F6A04D",
    }));
}

export function getSummaryCards(
  clients: Client[],
  dogs: Dog[],
  products: Product[]
): DashboardSummaryCardData[] {
  const averageClientAge = average(clients.map(getClientAgeInYears));
  const averageDogAge = average(dogs.map((dog) => dog.age));
  const totalStock = getTotalStock(products);

  return [
    {
      key: "clientes",
      title: "Clientes registrados",
      value: formatNumber(clients.length),
      helper: clients.length
        ? `${formatDecimal(averageClientAge, " anos")} de idade média`
        : "Nenhum cliente cadastrado",
      accent: "#FB8B24",
    },
    {
      key: "animais",
      title: "Animais registrados",
      value: formatNumber(dogs.length),
      helper: dogs.length
        ? `${formatDecimal(averageDogAge, " anos")} de idade média`
        : "Nenhum animal cadastrado",
      accent: "#E36414",
    },
    {
      key: "itens",
      title: "Itens em estoque",
      value: formatNumber(totalStock),
      helper: products.length
        ? `${formatNumber(products.length)} produtos cadastrados`
        : "Nenhum produto cadastrado",
      accent: "#1A2F3A",
    },
  ];
}

export function getChartSections(clients: Client[], dogs: Dog[], products: Product[]) {
  return [
    {
      title: "Volume por recursos",
      subtitle: "Comparativo rapido entre clientes, animais e produtos",
      kind: "donut",
      data: getOverviewChart(clients, dogs, products),
      emptyMessage: "Cadastre registros para acompanhar o volume geral.",
    },
    {
      title: "Faixa etária dos clientes",
      subtitle: "Distribuição baseada nas datas de nascimento já salvas",
      kind: "bar",
      data: getClientAgeChart(clients).filter((item) => item.value > 0),
      emptyMessage: "Sem clientes suficientes para montar a faixa etária.",
    },
    {
      title: "Produtos com maior estoque",
      subtitle: "Top 5 itens com mais unidades disponíveis agora",
      kind: "bar",
      data: getInventoryChart(products),
      emptyMessage: "Sem produtos cadastrados para comparar estoque.",
    },
  ] satisfies DashboardChartSection[];
}


