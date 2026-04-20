import { useMemo, useRef, type ChangeEvent } from "react";

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
import { useToast } from "../../hooks/useToast";
import { useProductCatalog } from "../../hooks/product/useProductCatalog";
import { useProducts } from "../../hooks/useProducts";
import type { Product } from "../../types/product";
import { normalizeCatalogCode } from "../../utils/product/productCatalog.util";
import "./produtos.css";

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
    name: "quantity",
    label: "Quantidade",
    type: "number",
    inputMode: "numeric",
    placeholder: "Ex.: 12",
  },
];

const numberFormatter = new Intl.NumberFormat("pt-BR");
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function formatNumberForInput(value: number, scale: number): string {
  if (!Number.isFinite(value)) {
    return "";
  }

  if (scale === 0) {
    return String(Math.round(value));
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(scale).replace(".", ",");
}

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
    price: formatNumberForInput(product.price ?? 0, 2),
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();
  const { items, isLoading, create, update, remove } = useProducts();
  const {
    items: catalogItems,
    isLoading: isCatalogLoading,
    importCatalog,
    isImporting,
    syncCosmosCatalog,
    isSyncingCosmos,
    lastImportSummary,
  } = useProductCatalog();

  const catalogOptions = useMemo(
    () =>
      catalogItems.map((item) => ({
        value: item.code,
        label: `${item.code} | ${item.name}`,
      })),
    [catalogItems]
  );

  const catalogByNormalizedCode = useMemo(
    () =>
      new Map(catalogItems.map((item) => [item.codeNormalized, item])),
    [catalogItems]
  );

  const productFormConfig = useMemo<RecordFormConfig>(
    () => ({
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
                    ? `${numberFormatter.format(
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
          price: formatNumberForInput(matchedCatalogItem.price, 2),
          quantity:
            typeof matchedCatalogItem.quantity === "number"
              ? formatNumberForInput(matchedCatalogItem.quantity, 0)
              : nextData.quantity,
        };
      },
      initialValues: createInitialFormData(baseProductFields),
    }),
    [catalogByNormalizedCode, catalogOptions]
  );

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleCosmosSync = async () => {
    try {
      const summary = await syncCosmosCatalog();
      toast.success(
        `Cosmos sincronizado: ${summary.imported} novos, ${summary.updated} atualizados e ${summary.ignored} ignorados.`
      );
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel sincronizar o catalogo via Cosmos agora."
      );
    }
  };

  const handleCatalogUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const summary = await importCatalog(file);
      toast.success(
        `Catalogo importado: ${summary.imported} novos, ${summary.updated} atualizados e ${summary.ignored} ignorados.`
      );
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel importar o catalogo agora."
      );
    } finally {
      event.target.value = "";
    }
  };

  const templateHref = `${import.meta.env.BASE_URL}product-catalog-template.csv`;

  return (
    <AppShell logoSrc={logoimg}>
      <Main
        icon="medkit"
        title="Produtos"
        subtitle="Gerencie os produtos cadastrados no sistema"
        fillHeight
        contentClassName="record-management-shell"
      >
        <div className="products-page">
          <section className="product-catalog-card">
            <div className="product-catalog-card__content">
              <div>
                <p className="product-catalog-card__eyebrow">Catalogo base</p>
                <h3>Importe uma tabela de produtos do pet shop</h3>
                <p className="product-catalog-card__description">
                  Envie um arquivo CSV ou XLSX, sincronize com a API do Cosmos ou
                  baixe um template.
                </p>
              </div>

              <div className="product-catalog-card__actions">
                <button
                  type="button"
                  className="product-catalog-card__button"
                  onClick={handleOpenFilePicker}
                  disabled={isImporting || isSyncingCosmos}
                >
                  {isImporting ? "Importando..." : "Importar catalogo"}
                </button>

                <button
                  type="button"
                  className="product-catalog-card__button product-catalog-card__button--secondary"
                  onClick={handleCosmosSync}
                  disabled={isImporting || isSyncingCosmos}
                  title="Sincroniza o catalogo base da Cosmos e atualiza os codigos no sistema."
                >
                  {isSyncingCosmos ? "Sincronizando..." : "Sincronizar via Cosmos"}
                </button>

                <a className="product-catalog-card__link" href={templateHref} download>
                  Baixar template CSV
                </a>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="product-catalog-card__input"
                  onChange={handleCatalogUpload}
                />
              </div>
            </div>

            <div className="product-catalog-card__stats">
              <article>
                <strong>{numberFormatter.format(catalogItems.length)}</strong>
                <span>codigos disponiveis</span>
              </article>
              <article>
                <strong>{isCatalogLoading ? "..." : "CSV / XLSX / Cosmos"}</strong>
                <span>fontes aceitas</span>
              </article>
            </div>

            <div className="product-catalog-card__summary">
              <strong>Ultima importacao:</strong>{" "}
              {lastImportSummary
                ? `${lastImportSummary.sourceFileName} | ${lastImportSummary.validRows} validos | ${lastImportSummary.imported} novos | ${lastImportSummary.updated} atualizados | ${lastImportSummary.ignored} ignorados`
                : "nenhuma importacao realizada ainda."}
            </div>
          </section>

          <RecordManagementView
            listGroup={buildProductListGroup(items)}
            records={items}
            formConfig={productFormConfig}
            isLoading={isLoading}
            listPageSize={4}
            backRoute={DASHBOARD_ROUTE}
            addAriaLabel="Adicionar novo produto"
            getFormData={getProductFormData}
            buildPayload={buildProductPayload}
            onCreate={create}
            onUpdate={update}
            onDelete={remove}
          />
        </div>
      </Main>
    </AppShell>
  );
}
