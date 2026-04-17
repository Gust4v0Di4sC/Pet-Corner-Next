import { getFirestoreDB } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

import type { Product } from "../types/product";

export const getAllProducts = async (
  rota: string = "prods"
): Promise<Product[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const snapshot = await getDocs(col);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product));
};

export const addProduct = async (
  rota: string,
  data: Omit<Product, "id">
): Promise<Product> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const docRef = await addDoc(col, data);
  return { id: docRef.id, ...data };
};

export const updateProduct = async (
  rota: string,
  id: string,
  data: Omit<Product, "id">
): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await setDoc(ref, data, { merge: true });
};

export const deleteProduct = async (
  rota: string,
  id: string
): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await deleteDoc(ref);
};

export const searchProductByName = async (
  rota: string,
  name: string
): Promise<Product[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const collectionQuery = query(col, where("name", "==", name));
  const snapshot = await getDocs(collectionQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product));
};
