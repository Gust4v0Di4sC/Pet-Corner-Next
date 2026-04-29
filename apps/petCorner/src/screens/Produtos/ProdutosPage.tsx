import { useCallback, useMemo, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

import logoimg from "../../assets/Logo.svg";
import { DASHBOARD_ROUTE } from "../../components/Dashboard/dashboard.domain";
import type { RecordFormData } from "../../components/Records/record.types";
import AppShell from "../../components/layout/AppShell";
import Main from "../../components/Templates/Main";
import { useProductCatalog } from "../../hooks/product";
import { useProducts } from "../../hooks/useProducts";
import { useToast } from "../../hooks/useToast";
import { fetchCosmosProductImageByCode } from "../../services/cosmosCatalogService";
import { setProductCatalogItemImage } from "../../services/productCatalogService";
import {
  importProductImageFromUrl,
  uploadProductImage,
} from "../../services/productImageService";
import type { Product } from "../../types/product";
import { normalizeCatalogCode } from "../../utils/product/productCatalog.util";
import {
  buildProductCatalogMap,
  productNumberFormatter,
} from "./produtos.records";
import { ProdutosRecordsSection } from "./ProdutosRecordsSection";
import "./produtos.css";

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

  const catalogByNormalizedCode = useMemo(
    () => buildProductCatalogMap(catalogItems),
    [catalogItems]
  );

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

      if (
        !/^https?:\/\//i.test(normalizedImageUrl) ||
        isWorkerManagedProductImageUrl(normalizedImageUrl)
      ) {
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

  const handleClearCatalog = async () => {
    if (!catalogItems.length) {
      toast.info("Nao ha codigos importados para limpar.");
      return;
    }

    const shouldClear = window.confirm(
      "Deseja realmente limpar todas as importacoes do catalogo? Essa acao remove a lista de codigos de autopreenchimento."
    );

    if (!shouldClear) {
      return;
    }

    try {
      const deletedItems = await clearCatalog();
      toast.success(
        `Catalogo limpo com sucesso. ${productNumberFormatter.format(deletedItems)} registro(s) removido(s).`
      );
    } catch (error) {
      toast.warning(
        error instanceof Error && error.message
          ? error.message
          : "Nao foi possivel limpar as importacoes agora."
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
  const importCatalogTooltip = "Importar catalogo via arquivo CSV ou XLSX";
  const cosmosSyncTooltip =
    "Sincroniza o catalogo base da Cosmos e atualiza os codigos no sistema.";
  const clearCatalogTooltip =
    "Remove todos os codigos importados para reiniciar o catalogo.";

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
                  aria-label={isImporting ? "Importando catalogo" : "Importar catalogo"}
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
                  aria-label={isClearingCatalog ? "Limpando importacoes" : "Limpar importacoes"}
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
                      aria-label="Carregando codigos disponiveis"
                    >
                      <i className="fa fa-paw" aria-hidden="true" />
                      <i className="fa fa-paw" aria-hidden="true" />
                      <i className="fa fa-paw" aria-hidden="true" />
                    </span>
                  ) : (
                    productNumberFormatter.format(catalogItems.length)
                  )}
                </strong>
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

          <ProdutosRecordsSection
            items={items}
            isLoading={isLoading}
            catalogItems={catalogItems}
            create={handleCreateProduct}
            update={handleUpdateProduct}
            remove={remove}
            onFileUpload={handleProductImageUpload}
            onInputAsyncEffect={handleProductCodeImageFallback}
          />
        </div>
      </Main>
    </AppShell>
  );
}
