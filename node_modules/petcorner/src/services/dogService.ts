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
import type { Client } from "../contexts/ClientContext"; // reaproveitando o tipo

// Reuso de Client como Dog (se quiser separar, basta criar um tipo Dog próprio)
export type Dog = Client;

// Buscar todos os dogs
export const getAllDogs = async (rota: string = "dogs"): Promise<Dog[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const snap = await getDocs(col);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog));
};

// Adicionar um dog
export const addDog = async (
  rota: string,
  data: Omit<Dog, "id">
): Promise<Dog> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const res = await addDoc(col, data);
  return { id: res.id, ...data };
};

// Atualizar um dog existente
export const updateDog = async (
  rota: string,
  id: string,
  data: Omit<Dog, "id">
): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await setDoc(ref, data, { merge: true }); // merge evita sobrescrever todo doc
};

// Deletar um dog
export const deleteDog = async (rota: string, id: string): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await deleteDoc(ref);
};

// Buscar dog pelo nome
export const searchDogByName = async (
  rota: string,
  name: string
): Promise<Dog[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const q = query(col, where("name", "==", name));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Dog));
};
