import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchCommonProductsFromCosmos } from "../../services/cosmosCatalogService";
import {
  clearProductCatalogItems,
  getAllProductCatalogItems,
  upsertProductCatalogItems,
} from "../../services/productCatalogService";
import type {
  ProductCatalogImportSummary,
  ProductCatalogItem,
  RawProductCatalogData,
} from "../../types/productCatalog";
import { parseProductCatalogFile } from "../../utils/product/productCatalogImport.util";
import {
  normalizeProductCatalogItem,
  productCatalogKeys,
} from "../../utils/product/productCatalog.util";

export function useProductCatalog(rota = "productCatalog") {
  const queryClient = useQueryClient();
  const [lastImportSummary, setLastImportSummary] = useState<ProductCatalogImportSummary | null>(
    null
  );

  const { data: items = [], isFetching } = useQuery<ProductCatalogItem[]>({
    queryKey: productCatalogKeys(rota),
    queryFn: async () => {
      const data = (await getAllProductCatalogItems(rota)) as RawProductCatalogData[];
      return data
        .map(normalizeProductCatalogItem)
        .sort((left, right) => left.code.localeCompare(right.code, "pt-BR"));
    },
  });

  const importMutation = useMutation<ProductCatalogImportSummary, Error, File>({
    mutationFn: async (file) => {
      const parsedFile = await parseProductCatalogFile(file);
      const result = await upsertProductCatalogItems(parsedFile.items, rota);

      return {
        totalRows: parsedFile.totalRows,
        validRows: parsedFile.validRows,
        imported: result.imported,
        updated: result.updated,
        ignored: parsedFile.ignored,
        sourceFileName: parsedFile.sourceFileName,
      };
    },
    onSuccess: (summary) => {
      setLastImportSummary(summary);
      queryClient.invalidateQueries({ queryKey: productCatalogKeys(rota) });
    },
  });

  const cosmosSyncMutation = useMutation<ProductCatalogImportSummary, Error>({
    mutationFn: async () => {
      const payload = await fetchCommonProductsFromCosmos();
      const result = await upsertProductCatalogItems(payload.items, rota);

      return {
        totalRows: payload.totalRows,
        validRows: payload.validRows,
        imported: result.imported,
        updated: result.updated,
        ignored: payload.ignored,
        sourceFileName: payload.sourceFileName,
      };
    },
    onSuccess: (summary) => {
      setLastImportSummary(summary);
      queryClient.invalidateQueries({ queryKey: productCatalogKeys(rota) });
    },
  });

  const clearCatalogMutation = useMutation<number, Error>({
    mutationFn: async () => clearProductCatalogItems(rota),
    onSuccess: () => {
      setLastImportSummary(null);
      queryClient.invalidateQueries({ queryKey: productCatalogKeys(rota) });
    },
  });

  const importCatalog = useCallback(
    async (file: File) => importMutation.mutateAsync(file),
    [importMutation]
  );
  const syncCosmosCatalog = useCallback(
    async () => cosmosSyncMutation.mutateAsync(),
    [cosmosSyncMutation]
  );
  const clearCatalog = useCallback(
    async () => clearCatalogMutation.mutateAsync(),
    [clearCatalogMutation]
  );

  return {
    items,
    isLoading: isFetching,
    importCatalog,
    isImporting: importMutation.isPending,
    syncCosmosCatalog,
    isSyncingCosmos: cosmosSyncMutation.isPending,
    clearCatalog,
    isClearingCatalog: clearCatalogMutation.isPending,
    lastImportSummary,
  };
}
