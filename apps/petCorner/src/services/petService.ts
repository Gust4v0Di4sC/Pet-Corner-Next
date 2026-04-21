import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { getFirestoreDB } from "../firebase";
import type { PetService } from "../types/petService";

export const getAllServices = async (
  rota: string = "services"
): Promise<PetService[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const snapshot = await getDocs(col);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PetService));
};

export const addService = async (
  rota: string,
  data: Omit<PetService, "id">
): Promise<PetService> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const docRef = await addDoc(col, data);
  return { id: docRef.id, ...data };
};

export const updateService = async (
  rota: string,
  id: string,
  data: Omit<PetService, "id">
): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await setDoc(ref, data, { merge: true });
};

export const deleteService = async (rota: string, id: string): Promise<void> => {
  const db = await getFirestoreDB();
  const ref = doc(db, rota, id);
  await deleteDoc(ref);
};

export const searchServiceByName = async (
  rota: string,
  name: string
): Promise<PetService[]> => {
  const db = await getFirestoreDB();
  const col = collection(db, rota);
  const collectionQuery = query(col, where("name", "==", name));
  const snapshot = await getDocs(collectionQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PetService));
};
