import { read, utils } from "xlsx";

import type { ProductCatalogImportInput } from "../../types/productCatalog";
import { normalizeCatalogCode } from "./productCatalog.util";

type ParsedCatalogFile = {
  items: ProductCatalogImportInput[];
  totalRows: number;
  validRows: number;
  ignored: number;
  sourceFileName: string;
};

type HeaderKey = "code" | "name" | "price" | "quantity" | "brand" | "category" | "imageUrl";

const HEADER_ALIASES: Record<HeaderKey, string[]> = {
  code: ["código", "code", "sku", "ean", "gtin"],
  name: ["nome", "descricao", "produto", "name"],
  price: ["preco", "valor", "price"],
  quantity: ["quantidade", "qty", "estoque"],
  brand: ["marca", "brand"],
  category: ["categoria", "category"],
  imageUrl: ["imagem", "image", "image url", "url imagem", "url da imagem", "foto"],
};

function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ");
}

function normalizeCell(value: unknown): string {
  return String(value ?? "").trim();
}

function parseNumericValue(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  let normalizedValue = trimmedValue.replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
  const hasComma = normalizedValue.includes(",");
  const hasDot = normalizedValue.includes(".");

  if (hasComma && hasDot) {
    normalizedValue =
      normalizedValue.lastIndexOf(",") > normalizedValue.lastIndexOf(".")
        ? normalizedValue.replace(/\./g, "").replace(",", ".")
        : normalizedValue.replace(/,/g, "");
  } else if (hasComma) {
    normalizedValue = normalizedValue.replace(/\./g, "").replace(",", ".");
  } else {
    normalizedValue = normalizedValue.replace(/,/g, "");
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseImageUrl(value: string): string | undefined {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return undefined;
}

function getNormalizedHeaders(row: Record<string, unknown>): Map<string, string> {
  return new Map(Object.keys(row).map((key) => [normalizeHeader(key), key]));
}

function getRawValue(
  row: Record<string, unknown>,
  headers: Map<string, string>,
  aliases: string[]
): string {
  for (const alias of aliases) {
    const key = headers.get(normalizeHeader(alias));

    if (key) {
      return normalizeCell(row[key]);
    }
  }

  return "";
}

function buildImportItem(
  row: Record<string, unknown>,
  headers: Map<string, string>,
  sourceFileName: string
): ProductCatalogImportInput | null {
  const code = getRawValue(row, headers, HEADER_ALIASES.code);
  const name = getRawValue(row, headers, HEADER_ALIASES.name);
  const price = parseNumericValue(getRawValue(row, headers, HEADER_ALIASES.price));

  if (!code || !name || price === null) {
    return null;
  }

  const quantityValue = parseNumericValue(getRawValue(row, headers, HEADER_ALIASES.quantity));
  const brand = getRawValue(row, headers, HEADER_ALIASES.brand);
  const category = getRawValue(row, headers, HEADER_ALIASES.category);
  const imageUrl = parseImageUrl(getRawValue(row, headers, HEADER_ALIASES.imageUrl));

  return {
    code,
    codeNormalized: normalizeCatalogCode(code),
    name,
    price,
    quantity: quantityValue === null ? undefined : quantityValue,
    brand: brand || undefined,
    category: category || undefined,
    imageUrl,
    sourceFileName,
    isTemplate: false,
  };
}

export async function parseProductCatalogFile(file: File): Promise<ParsedCatalogFile> {
  const normalizedFileName = file.name.toLowerCase();

  if (!normalizedFileName.endsWith(".csv") && !normalizedFileName.endsWith(".xlsx")) {
    throw new Error("Envie um arquivo CSV ou XLSX.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = read(buffer, { type: "array" });
  const [firstSheetName] = workbook.SheetNames;

  if (!firstSheetName) {
    throw new Error("A planilha enviada não possui abas válidas.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (!rows.length) {
    throw new Error("A planilha enviada não possui linhas para importar.");
  }

  const headers = getNormalizedHeaders(rows[0]);
  const missingHeaders = (["code", "name", "price"] as HeaderKey[]).filter(
    (header) =>
      !HEADER_ALIASES[header].some((alias) => headers.has(normalizeHeader(alias)))
  );

  if (missingHeaders.length) {
    throw new Error(
      `Colunas obrigatorias ausentes: ${missingHeaders
        .map((header) => HEADER_ALIASES[header][0])
        .join(", ")}.`
    );
  }

  const dedupedItems = new Map<string, ProductCatalogImportInput>();
  let ignored = 0;

  rows.forEach((row) => {
    const item = buildImportItem(row, headers, file.name);

    if (!item) {
      ignored += 1;
      return;
    }

    dedupedItems.set(item.codeNormalized, item);
  });

  const items = Array.from(dedupedItems.values());

  if (!items.length) {
    throw new Error("Nenhum produto valido foi encontrado na planilha.");
  }

  return {
    items,
    totalRows: rows.length,
    validRows: items.length,
    ignored,
    sourceFileName: file.name,
  };
}
