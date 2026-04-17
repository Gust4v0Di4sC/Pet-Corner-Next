import logoimg from "../../assets/Logo.svg";
import RecordManagementView from "../../components/Records/RecordManagementView";
import type {
  RecordFormConfig,
  RecordFormData,
  RecordFormField,
  RecordListGroup,
} from "../../components/Records/record.types";
import {
  createInitialFormData,
  parseNumberField,
} from "../../components/Records/record.utils";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useProducts } from "../../hooks/useProducts";
import type { Product } from "../../types/product";

const productFields: RecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  { name: "price", label: "Preco", type: "number" },
  { name: "code", label: "Codigo", type: "text" },
  { name: "quantity", label: "Quantidade", type: "number" },
];

const productFormConfig: RecordFormConfig = {
  entityLabel: "produto",
  createTitle: "Novo produto",
  createSubmitLabel: "Adicionar produto",
  createSuccessMessage: "Produto cadastrado com sucesso!",
  editTitle: "Editar produto",
  editSubmitLabel: "Salvar alteracoes",
  editSuccessMessage: "Produto atualizado com sucesso!",
  deleteSuccessMessage: "Produto removido com sucesso!",
  fields: productFields,
  initialValues: createInitialFormData(productFields),
};

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function buildProductListGroup(products: Product[]): RecordListGroup {
  return {
    title: "Lista de produtos",
    subtitle: `${numberFormatter.format(products.length)} produtos no painel`,
    emptyMessage: "Nenhum produto cadastrado ate o momento.",
    items: [...products]
      .filter(
        (product): product is Product & { id: string } =>
          typeof product.id === "string" && Boolean(product.id)
      )
      .sort((left, right) => right.quantity - left.quantity)
      .map((product) => ({
        id: product.id,
        title: product.name || "Produto sem nome",
        subtitle: `Codigo ${product.code || "nao informado"}`,
        detail: `${currencyFormatter.format(product.price)} | ${numberFormatter.format(
          product.quantity
        )} unidades`,
        badge: `Estoque ${numberFormatter.format(product.quantity)}`,
      })),
  };
}

function getProductFormData(product: Product): RecordFormData {
  return {
    name: product.name ?? "",
    price: String(product.price ?? ""),
    code: product.code ?? "",
    quantity: String(product.quantity ?? ""),
  };
}

function buildProductPayload(formData: RecordFormData): Omit<Product, "id"> {
  return {
    name: formData.name.trim(),
    price: parseNumberField(formData.price, "preco"),
    code: formData.code.trim(),
    quantity: parseNumberField(formData.quantity, "quantidade"),
  };
}

export default function ProdutosPage() {
  const { items, isLoading, create, update, remove } = useProducts();

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="medkit"
        title="Produtos"
        subtitle="Gerencie os produtos cadastrados no sistema"
        fillHeight
        contentClassName="record-management-shell"
      >
        <RecordManagementView
          listGroup={buildProductListGroup(items)}
          records={items}
          formConfig={productFormConfig}
          isLoading={isLoading}
          backRoute={DASHBOARD_ROUTE}
          addAriaLabel="Adicionar novo produto"
          getFormData={getProductFormData}
          buildPayload={buildProductPayload}
          onCreate={create}
          onUpdate={update}
          onDelete={remove}
        />
      </Main>
    </AppShell>
  );
}
