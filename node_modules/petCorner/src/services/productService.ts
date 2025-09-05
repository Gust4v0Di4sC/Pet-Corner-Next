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

export type Product = {
  id?: string;
  name: string;
  price: number;
  code: string;
  quantity: number;
};

// Buscar todos os produtos
export const getAllProducts = async (
  rota: string = "prods"
): Promise<Product[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const snapshot = await getDocs(col);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
};

// Adicionar produto
export const addProduct = async (
  rota: string,
  data: Omit<Product, "id">
): Promise<Product> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const docRef = await addDoc(col, data);
  return { id: docRef.id, ...data };
};

// Atualizar produto
export const updateProduct = async (
  rota: string,
  id: string,
  data: Omit<Product, "id">
): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await setDoc(ref, data, { merge: true }); // merge para não sobrescrever tudo
};

// Deletar produto
export const deleteProduct = async (
  rota: string,
  id: string
): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await deleteDoc(ref);
};

// Buscar produto pelo nome
export const searchProductByName = async (
  rota: string,
  name: string
): Promise<Product[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const q = query(col, where("name", "==", name));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
};
