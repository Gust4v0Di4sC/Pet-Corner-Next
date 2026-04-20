import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

import { getFirestoreDB } from "../firebase";
import type { ProductCatalogImportInput, ProductCatalogItem } from "../types/productCatalog";

type UpsertCatalogResult = {
  imported: number;
  updated: number;
};

const BATCH_LIMIT = 400;

function chunkItems<TItem>(items: TItem[], size: number): TItem[][] {
  const chunks: TItem[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

export async function getAllProductCatalogItems(
  rota = "productCatalog"
): Promise<ProductCatalogItem[]> {
  const db = await getFirestoreDB();
  const snapshot = await getDocs(collection(db, rota));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as ProductCatalogItem[];
}

export async function upsertProductCatalogItems(
  items: ProductCatalogImportInput[],
  rota = "productCatalog"
): Promise<UpsertCatalogResult> {
  const db = await getFirestoreDB();
  let imported = 0;
  let updated = 0;

  for (const chunk of chunkItems(items, BATCH_LIMIT)) {
    const refs = chunk.map((item) => doc(db, rota, item.codeNormalized));
    const snapshots = await Promise.all(refs.map((ref) => getDoc(ref)));
    const batch = writeBatch(db);

    chunk.forEach((item, index) => {
      const snapshot = snapshots[index];
      const uploadedAt =
        snapshot.exists() && snapshot.data().uploadedAt
          ? snapshot.data().uploadedAt
          : serverTimestamp();

      if (snapshot.exists()) {
        updated += 1;
      } else {
        imported += 1;
      }

      batch.set(
        refs[index],
        {
          ...item,
          uploadedAt,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });

    await batch.commit();
  }

  return { imported, updated };
}

export async function clearProductCatalogItems(rota = "productCatalog"): Promise<number> {
  const db = await getFirestoreDB();
  const snapshot = await getDocs(collection(db, rota));

  if (snapshot.empty) {
    return 0;
  }

  let deleted = 0;

  for (const chunk of chunkItems(snapshot.docs, BATCH_LIMIT)) {
    const batch = writeBatch(db);
    chunk.forEach((catalogDoc) => {
      batch.delete(doc(db, rota, catalogDoc.id));
    });
    await batch.commit();
    deleted += chunk.length;
  }

  return deleted;
}

export async function setProductCatalogItemImage(
  codeNormalized: string,
  imageUrl: string,
  rota = "productCatalog"
): Promise<void> {
  const normalizedCode = codeNormalized.trim().toUpperCase();
  const normalizedImageUrl = imageUrl.trim();

  if (!normalizedCode || !normalizedImageUrl) {
    return;
  }

  const db = await getFirestoreDB();
  const catalogRef = doc(db, rota, normalizedCode);

  await setDoc(
    catalogRef,
    {
      imageUrl: normalizedImageUrl,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
