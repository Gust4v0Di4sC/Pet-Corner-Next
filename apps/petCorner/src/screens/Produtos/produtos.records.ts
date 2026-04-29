import type {
  RecordFormConfig,
  RecordFormData,
  RecordFormField,
  RecordListGroup,
} from "../../components/Records/record.types";
import { createInitialFormData } from "../../components/Records/record.utils";
import type { Product } from "../../types/product";
import type { ProductCatalogItem } from "../../types/productCatalog";
import { normalizeCatalogCode } from "../../utils/product/productCatalog.util";
import { productRecordSchema } from "../../validation/recordSchemas";

const baseProductFields: RecordFormField[] = [
  { name: "name", label: "Nome", type: "text" },
  {
    name: "price",
    label: "Preco",
    type: "number",
    placeholder: "Ex.: 29,90",
    inputMode: "decimal",
    mask: {
      mask: Number,
      scale: 2,
      signed: false,
      min: 0,
      max: 999999.99,
      thousandsSeparator: "",
      normalizeZeros: true,
      padFractionalZeros: false,
      radix: ",",
      mapToRadix: ["."],
    },
  },
  { name: "code", label: "Codigo", type: "text", placeholder: "Ex.: PET-RA-001" },
  {
    name: "imageUrl",
    label: "Imagem do produto",
    type: "file",
    required: false,
    accept: "image/*",
  },
  {
    name: "quantity",
    label: "Quantidade",
    type: "number",
    inputMode: "numeric",
    placeholder: "Ex.: 12",
    mask: {
      mask: Number,
      scale: 0,
      signed: false,
      min: 0,
      max: 999999,
      thousandsSeparator: "",
      normalizeZeros: true,
      radix: ",",
      mapToRadix: ["."],
    },
  },
];

export const productNumberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

export function formatProductNumberForInput(value: number, scale: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (scale === 0) {
    return String(Math.round(value));
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(scale).replace(".", ",");
}

export function buildProductCatalogMap(catalogItems: ProductCatalogItem[]) {
  return new Map(catalogItems.map((item) => [item.codeNormalized, item]));
}

export function buildProductListGroup(products: Product[]): RecordListGroup {
  return {
    title: "Lista de produtos",
    subtitle: `${productNumberFormatter.format(products.length)} produtos no painel`,
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
        detail: `${currencyFormatter.format(product.price)} | ${productNumberFormatter.format(
          product.quantity
        )} unidades`,
        badge: `Estoque ${productNumberFormatter.format(product.quantity)}`,
      })),
  };
}

export function getProductFormData(product: Product): RecordFormData {
  return {
    name: product.name ?? "",
    price: formatProductNumberForInput(product.price ?? 0, 2),
    code: product.code ?? "",
    imageUrl: product.imageUrl ?? "",
    quantity: String(product.quantity ?? ""),
  };
}

export function buildProductPayload(formData: RecordFormData): Omit<Product, "id"> {
  return productRecordSchema.parse(formData);
}

export function createProductFormConfig(catalogItems: ProductCatalogItem[]): RecordFormConfig {
  const catalogOptions = catalogItems.map((item) => ({
    value: item.code,
    label: `${item.code} | ${item.name}`,
  }));
  const catalogByNormalizedCode = buildProductCatalogMap(catalogItems);

  return {
    entityLabel: "produto",
    createTitle: "Novo produto",
    createSubmitLabel: "Adicionar produto",
    createSuccessMessage: "Produto cadastrado com sucesso!",
    editTitle: "Editar produto",
    editSubmitLabel: "Salvar alteracoes",
    editSuccessMessage: "Produto atualizado com sucesso!",
    deleteSuccessMessage: "Produto removido com sucesso!",
    fields: baseProductFields,
    resolveFields: (_formData, context) =>
      baseProductFields.map((field) =>
        field.name !== "code"
          ? field
          : {
              ...field,
              type: context.isEditing ? "text" : "autocomplete",
              options: context.isEditing ? undefined : catalogOptions,
              placeholder: context.isEditing
                ? "Ex.: PET-RA-001"
                : catalogOptions.length
                  ? "Digite ou selecione um codigo do catalogo"
                  : "Importe uma planilha ou sincronize via Cosmos",
              helperText: context.isEditing
                ? undefined
                : catalogOptions.length
                  ? `${productNumberFormatter.format(
                      catalogOptions.length
                    )} codigos disponiveis para autopreenchimento.`
                  : "Nenhum catalogo carregado. Importe CSV/XLSX ou sincronize via Cosmos.",
            }
      ),
    mapInput: ({ name, value, currentData, isEditing }) => {
      const nextData = { ...currentData, [name]: value };

      if (isEditing || name !== "code") {
        return nextData;
      }

      const matchedCatalogItem = catalogByNormalizedCode.get(normalizeCatalogCode(value));

      if (!matchedCatalogItem) {
        return nextData;
      }

      return {
        ...nextData,
        code: matchedCatalogItem.code,
        name: matchedCatalogItem.name,
        imageUrl: matchedCatalogItem.imageUrl ?? nextData.imageUrl,
        price: formatProductNumberForInput(matchedCatalogItem.price, 2),
        quantity:
          typeof matchedCatalogItem.quantity === "number"
            ? formatProductNumberForInput(matchedCatalogItem.quantity, 0)
            : nextData.quantity,
      };
    },
    initialValues: createInitialFormData(baseProductFields),
  };
}
