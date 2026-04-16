import type { Client } from "../../types/client";
import type { Dog } from "../../types/dog";
import type { Product } from "../../types/product";
import type {
  DashboardChartData,
  DashboardChartSection,
  DashboardDomainKey,
  DashboardQuickStat,
  DashboardRecordGroup,
  DashboardRecordItem,
  DashboardSummaryCardData,
} from "./dashboard.types";

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatCurrency(value: number): string {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

function formatDecimal(value: number, suffix = ""): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(1).replace(".", ",")}${suffix}`;
}

function average(values: number[]): number {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getClientAgeInYears(client: Client): number {
  const birthDate = client.age.toDate();
  const today = new Date();

  let years = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (beforeBirthday) {
    years -= 1;
  }

  return Math.max(years, 0);
}

function getTotalStock(products: Product[]): number {
  return products.reduce((total, product) => total + Math.max(product.quantity, 0), 0);
}

function getClientsWithEmailRate(clients: Client[]): number {
  if (!clients.length) return 0;

  const withEmail = clients.filter((client) => client.email.trim()).length;
  return (withEmail / clients.length) * 100;
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
      helper: `${formatNumber(products.length)} no catalogo`,
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
      helper: `Codigo ${product.code || "sem codigo"}`,
      accent: index % 2 === 0 ? "#FB8B24" : "#F6A04D",
    }));
}

function buildClientRecords(clients: Client[]): DashboardRecordItem[] {
  return [...clients]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((client) => ({
      id: client.id,
      title: client.name || "Cliente sem nome",
      subtitle: client.email || "Sem e-mail cadastrado",
      detail: `Nascimento ${formatDate(client.age.toDate())} | Telefone ${String(
        client.phone || "-"
      )}`,
      badge: `${getClientAgeInYears(client)} anos`,
    }));
}

function buildDogRecords(dogs: Dog[]): DashboardRecordItem[] {
  return [...dogs]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((dog, index) => ({
      id: dog.id ?? `dog-${index}`,
      title: dog.name || "Animal sem nome",
      subtitle: dog.breed || "Raca nao informada",
      detail: `${formatDecimal(dog.age, " anos")} | ${formatDecimal(dog.weight, " kg")}`,
      badge: `${formatDecimal(dog.weight, " kg")}`,
    }));
}

function buildProductRecords(products: Product[]): DashboardRecordItem[] {
  return [...products]
    .sort((left, right) => right.quantity - left.quantity)
    .map((product, index) => ({
      id: product.id ?? `product-${index}`,
      title: product.name || "Produto sem nome",
      subtitle: `Codigo ${product.code || "nao informado"}`,
      detail: `${formatCurrency(product.price)} | ${formatNumber(product.quantity)} unidades`,
      badge: `Estoque ${formatNumber(product.quantity)}`,
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
        ? `${formatDecimal(averageClientAge, " anos")} de idade media`
        : "Nenhum cliente cadastrado",
      accent: "#FB8B24",
    },
    {
      key: "animais",
      title: "Animais registrados",
      value: formatNumber(dogs.length),
      helper: dogs.length
        ? `${formatDecimal(averageDogAge, " anos")} de idade media`
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

export function getQuickStats(
  clients: Client[],
  dogs: Dog[],
  products: Product[]
): DashboardQuickStat[] {
  const averageProductPrice = average(products.map((product) => product.price));
  const averageDogWeight = average(dogs.map((dog) => dog.weight));

  return [
    {
      label: "Produtos cadastrados",
      value: formatNumber(products.length),
    },
    {
      label: "Preco medio dos produtos",
      value: formatCurrency(averageProductPrice),
    },
    {
      label: "Peso medio dos animais",
      value: formatDecimal(averageDogWeight, " kg"),
    },
    {
      label: "Clientes com e-mail",
      value: `${getClientsWithEmailRate(clients).toFixed(0)}%`,
    },
  ];
}

export function getChartSections(clients: Client[], dogs: Dog[], products: Product[]) {
  return [
    {
      title: "Volume por dominio",
      subtitle: "Comparativo rapido entre clientes, animais e produtos",
      kind: "donut",
      data: getOverviewChart(clients, dogs, products),
      emptyMessage: "Cadastre registros para acompanhar o volume geral.",
    },
    {
      title: "Faixa etaria dos clientes",
      subtitle: "Distribuicao baseada nas datas de nascimento ja salvas",
      kind: "bar",
      data: getClientAgeChart(clients).filter((item) => item.value > 0),
      emptyMessage: "Sem clientes suficientes para montar a faixa etaria.",
    },
    {
      title: "Produtos com maior estoque",
      subtitle: "Top 5 itens com mais unidades disponiveis agora",
      kind: "bar",
      data: getInventoryChart(products),
      emptyMessage: "Sem produtos cadastrados para comparar estoque.",
    },
  ] satisfies DashboardChartSection[];
}

export function getRecordGroup(
  domain: DashboardDomainKey,
  clients: Client[],
  dogs: Dog[],
  products: Product[]
): DashboardRecordGroup {
  if (domain === "animais") {
    return {
      title: "Lista de animais",
      subtitle: `${formatNumber(dogs.length)} registros encontrados`,
      emptyMessage: "Nenhum animal registrado ate o momento.",
      items: buildDogRecords(dogs),
    };
  }

  if (domain === "itens") {
    return {
      title: "Lista de produtos",
      subtitle: `${formatNumber(products.length)} produtos no painel`,
      emptyMessage: "Nenhum produto cadastrado ate o momento.",
      items: buildProductRecords(products),
    };
  }

  return {
    title: "Lista de clientes",
    subtitle: `${formatNumber(clients.length)} registros encontrados`,
    emptyMessage: "Nenhum cliente registrado ate o momento.",
    items: buildClientRecords(clients),
  };
}
