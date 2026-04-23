import { useCallback, useMemo, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

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
} from "../../components/Records/record.utils";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useToast } from "../../hooks/useToast";
import { useProductCatalog } from "../../hooks/product/useProductCatalog";
import { useProducts } from "../../hooks/useProducts";
import { fetchCosmosProductImageByCode } from "../../services/cosmosCatalogService";
import { setProductCatalogItemImage } from "../../services/productCatalogService";
import {
  importProductImageFromUrl,
  uploadProductImage,
} from "../../services/productImageService";
import type { Product } from "../../types/product";
import { productRecordSchema } from "../../validation/recordSchemas";
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
  { name: "code", label: "Código", type: "text", placeholder: "Ex.: PET-RA-001" },
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
    emptyMessage: "Nenhum produto cadastrado até o momento.",
    items: [...products]
      .filter(
        (product): product is Product & { id: string } =>
          typeof product.id === "string" && Boolean(product.id)
      )
      .sort((left, right) => right.quantity - left.quantity)
      .map((product) => ({
        id: product.id,
        title: product.name || "Produto sem nome",
        subtitle: `Código ${product.code || "não informado"}`,
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
    imageUrl: product.imageUrl ?? "",
    quantity: String(product.quantity ?? ""),
  };
}

function buildProductPayload(formData: RecordFormData): Omit<Product, "id"> {
  return productRecordSchema.parse(formData);
}

function isWorkerManagedProductImageUrl(imageUrl: string): boolean {
  try {
    const parsedUrl = new URL(imageUrl);
    return parsedUrl.pathname.includes("/products/image/");
  } catch {
    return false;
  }
}

export default function ProdutosPage() {
  const navigate = useNavigate();
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
    clearCatalog,
    isClearingCatalog,
    lastImportSummary,
  } = useProductCatalog();
  const isCatalogMutating = isImporting || isSyncingCosmos || isClearingCatalog;
  const isCatalogCountLoading = isCatalogLoading || isImporting || isSyncingCosmos;
  const codeImageCacheRef = useRef(new Map<string, string>());
  const codeLookupInFlightRef = useRef(new Set<string>());

  const handleProductImageUpload = useCallback(
    async ({ file }: { fieldName: string; file: File; currentValue: string }) => {
      const uploaded = await uploadProductImage(file);
      toast.success("Imagem enviada para o bucket com sucesso.");
      return uploaded.imageUrl;
    },
    [toast]
  );

  const ensureProductImageInBucket = useCallback(
    async (payload: Omit<Product, "id">): Promise<Omit<Product, "id">> => {
      const normalizedImageUrl = payload.imageUrl?.trim();

      if (!normalizedImageUrl) {
        return {
          ...payload,
          imageUrl: "",
        };
      }

      if (!/^https?:\/\//i.test(normalizedImageUrl) || isWorkerManagedProductImageUrl(normalizedImageUrl)) {
        return {
          ...payload,
          imageUrl: normalizedImageUrl,
        };
      }

      const imported = await importProductImageFromUrl(normalizedImageUrl, {
        code: payload.code,
      });

      return {
        ...payload,
        imageUrl: imported.imageUrl,
      };
    },
    []
  );

  const handleCreateProduct = useCallback(
    async (payload: Omit<Product, "id">) => {
      const payloadWithImage = await ensureProductImageInBucket(payload);
      await create(payloadWithImage);
    },
    [create, ensureProductImageInBucket]
  );

  const handleUpdateProduct = useCallback(
    async (recordId: string, payload: Omit<Product, "id">) => {
      const payloadWithImage = await ensureProductImageInBucket(payload);
      await update(recordId, payloadWithImage);
    },
    [ensureProductImageInBucket, update]
  );

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

  const handleProductCodeImageFallback = useCallback(
    async ({
      name,
      nextData,
      isEditing,
    }: {
      name: string;
      value: string;
      currentData: RecordFormData;
      nextData: RecordFormData;
      isEditing: boolean;
    }) => {
      if (isEditing || name !== "code") {
        return;
      }

      const selectedCode = nextData.code.trim();

      if (!selectedCode) {
        return {
          imageUrl: "",
        };
      }

      if (nextData.imageUrl.trim()) {
        return;
      }

      const normalizedCode = normalizeCatalogCode(selectedCode);
      const matchedCatalogItem = catalogByNormalizedCode.get(normalizedCode);

      if (!matchedCatalogItem) {
        return;
      }

      if (matchedCatalogItem.imageUrl?.trim()) {
        return {
          imageUrl: matchedCatalogItem.imageUrl,
        };
      }

      if (codeImageCacheRef.current.has(normalizedCode)) {
        const cachedImageUrl = codeImageCacheRef.current.get(normalizedCode) ?? "";
        return cachedImageUrl
          ? {
              imageUrl: cachedImageUrl,
            }
          : undefined;
      }

      if (codeLookupInFlightRef.current.has(normalizedCode)) {
        return;
      }

      codeLookupInFlightRef.current.add(normalizedCode);

      try {
        const cosmosImagePayload = await fetchCosmosProductImageByCode(matchedCatalogItem.code);

        if (!cosmosImagePayload.hasImage || !cosmosImagePayload.imageUrl.trim()) {
          codeImageCacheRef.current.set(normalizedCode, "");
          return;
        }

        const importedAsset = await importProductImageFromUrl(cosmosImagePayload.imageUrl, {
          code: matchedCatalogItem.code,
        });
        const importedImageUrl = importedAsset.imageUrl.trim();

        if (!importedImageUrl) {
          codeImageCacheRef.current.set(normalizedCode, "");
          return;
        }

        codeImageCacheRef.current.set(normalizedCode, importedImageUrl);

        void setProductCatalogItemImage(normalizedCode, importedImageUrl).catch(() => undefined);

        return {
          imageUrl: importedImageUrl,
        };
      } catch {
        codeImageCacheRef.current.set(normalizedCode, "");
        return;
      } finally {
        codeLookupInFlightRef.current.delete(normalizedCode);
      }
    },
    [catalogByNormalizedCode]
  );

  const productFormConfig = useMemo<RecordFormConfig>(
    () => ({
      entityLabel: "produto",
      createTitle: "Novo produto",
      createSubmitLabel: "Adicionar produto",
      createSuccessMessage: "Produto cadastrado com sucesso!",
      editTitle: "Editar produto",
      editSubmitLabel: "Salvar alterações",
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
                    ? "Digite ou selecione um código do catálogo"
                    : "Importe uma planilha ou sincronize via Cosmos",
                helperText: context.isEditing
                  ? undefined
                  : catalogOptions.length
                    ? `${numberFormatter.format(
                        catalogOptions.length
                      )} códigos disponíveis para autopreenchimento.`
                    : "Nenhum catálogo carregado. Importe CSV/XLSX ou sincronize via Cosmos.",
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
          : "Não foi possível sincronizar o catálogo via Cosmos agora."
      );
    }
  };

  const handleClearCatalog = async () => {
    if (!catalogItems.length) {
      toast.info("Não há códigos importados para limpar.");
      return;
    }

    const shouldClear = window.confirm(
      "Deseja realmente limpar todas as importações do catálogo? Essa ação remove a lista de códigos de autopreenchimento."
    );

    if (!shouldClear) {
      return;
    }

    try {
      const deletedItems = await clearCatalog();
      toast.success(
        `Catálogo limpo com sucesso. ${numberFormatter.format(deletedItems)} registro(s) removido(s).`
      );
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível limpar as importações agora."
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
        `Catálogo importado: ${summary.imported} novos, ${summary.updated} atualizados e ${summary.ignored} ignorados.`
      );
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível importar o catálogo agora."
      );
    } finally {
      event.target.value = "";
    }
  };

  const templateHref = `${import.meta.env.BASE_URL}product-catalog-template.csv`;
  const importCatalogTooltip = "Importar catálogo via arquivo CSV ou XLSX";
  const cosmosSyncTooltip =
    "Sincroniza o catálogo base da Cosmos e atualiza os códigos no sistema.";
  const clearCatalogTooltip =
    "Remove todos os códigos importados para reiniciar o catálogo.";

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
                <button
                  type="button"
                  className="product-catalog-card__back"
                  onClick={() => navigate(DASHBOARD_ROUTE)}
                >
                  <i className="fa fa-arrow-left" aria-hidden="true" />
                  Voltar ao dashboard
                </button>
                <h3>Importe uma tabela de produtos do pet shop</h3>
                <p className="product-catalog-card__description">
                  Envie um arquivo CSV ou XLSX, sincronize com a API do Cosmos ou
                  baixe um template.
                </p>
              </div>

              <div className="product-catalog-card__actions">
                <button
                  type="button"
                  className="product-catalog-card__button product-catalog-card__button--icon"
                  onClick={handleOpenFilePicker}
                  disabled={isCatalogMutating}
                  title={importCatalogTooltip}
                  aria-label={isImporting ? "Importando catálogo" : "Importar catálogo"}
                >
                  <i
                    className={`fa ${isImporting ? "fa-spinner fa-spin" : "fa-file-arrow-up"}`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="product-catalog-card__button product-catalog-card__button--secondary product-catalog-card__button--icon"
                  onClick={handleCosmosSync}
                  disabled={isCatalogMutating}
                  title={cosmosSyncTooltip}
                  aria-label={isSyncingCosmos ? "Sincronizando via Cosmos" : "Sincronizar via Cosmos"}
                >
                  <i
                    className={`fa ${isSyncingCosmos ? "fa-spinner fa-spin" : "fa-arrows-rotate"}`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  className="product-catalog-card__button product-catalog-card__button--danger product-catalog-card__button--icon"
                  onClick={handleClearCatalog}
                  disabled={isCatalogMutating || catalogItems.length === 0}
                  title={clearCatalogTooltip}
                  aria-label={isClearingCatalog ? "Limpando importações" : "Limpar importações"}
                >
                  <i
                    className={`fa ${isClearingCatalog ? "fa-spinner fa-spin" : "fa-trash-can"}`}
                    aria-hidden="true"
                  />
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
                <strong>
                  {isCatalogCountLoading ? (
                    <span
                      className="product-catalog-card__paw-loader"
                      role="status"
                      aria-live="polite"
                      aria-label="Carregando códigos disponíveis"
                    >
                      <i className="fa fa-paw" aria-hidden="true" />
                      <i className="fa fa-paw" aria-hidden="true" />
                      <i className="fa fa-paw" aria-hidden="true" />
                    </span>
                  ) : (
                    numberFormatter.format(catalogItems.length)
                  )}
                </strong>
                <span>códigos disponíveis</span>
              </article>
              <article>
                <strong>{isCatalogLoading ? "..." : "CSV / XLSX / Cosmos"}</strong>
                <span>fontes aceitas</span>
              </article>
            </div>

            <div className="product-catalog-card__summary">
              <strong>Última importação:</strong>{" "}
              {lastImportSummary
                ? `${lastImportSummary.sourceFileName} | ${lastImportSummary.validRows} válidos | ${lastImportSummary.imported} novos | ${lastImportSummary.updated} atualizados | ${lastImportSummary.ignored} ignorados`
                : "nenhuma importação realizada ainda."}
            </div>
          </section>

          <RecordManagementView
            listGroup={buildProductListGroup(items)}
            records={items}
            formConfig={productFormConfig}
            isLoading={isLoading}
            listPageSize={4}
            backRoute={DASHBOARD_ROUTE}
            showBackButton={false}
            addAriaLabel="Adicionar novo produto"
            getFormData={getProductFormData}
            buildPayload={buildProductPayload}
            onCreate={handleCreateProduct}
            onUpdate={handleUpdateProduct}
            onDelete={remove}
            onFileUpload={handleProductImageUpload}
            onInputAsyncEffect={handleProductCodeImageFallback}
          />
        </div>
      </Main>
    </AppShell>
  );
}

