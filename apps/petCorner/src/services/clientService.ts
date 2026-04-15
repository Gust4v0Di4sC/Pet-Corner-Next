// services/clientService.ts
import { getFirestoreDB } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  setDoc,
  Timestamp,
} from "firebase/firestore";

import type { Client, RawClientData } from "../types/client";

type ClientInput = Omit<Client, "id"> & { age: Timestamp | Date };

function ensureTimestamp(value: Timestamp | Date): Timestamp {
  return value instanceof Timestamp ? value : Timestamp.fromDate(value);
}

// Buscar todos
export const getAllClients = async (rota: string): Promise<RawClientData[]> => {
  const db = await getFirestoreDB();
  const colRef = collection(db, rota);
  const snapshot = await getDocs(colRef);

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as RawClientData[];
};

// Adicionar
export const addClient = async (rota: string, data: ClientInput): Promise<RawClientData> => {
  const db = await getFirestoreDB();
  const colRef = collection(db, rota);

  const preparedData = {
    ...data,
    age: ensureTimestamp(data.age), // ✅ grava Timestamp
  };

  const docRef = await addDoc(colRef, preparedData);

  return { id: docRef.id, ...preparedData } as RawClientData;
};

// Atualizar
export const updateClient = async (rota: string, id: string, data: ClientInput): Promise<void> => {
  const db = await getFirestoreDB();
  const docRef = doc(db, rota, id);

  const preparedData = {
    ...data,
    age: ensureTimestamp(data.age),
  };

  await setDoc(docRef, preparedData, { merge: true });
};

// Deletar
export const deleteClient = async (rota: string, id: string): Promise<void> => {
  const db = await getFirestoreDB();
  const docRef = doc(db, rota, id);
  await deleteDoc(docRef);
};

// Buscar por nome
export const searchClientByName = async (rota: string, name: string): Promise<RawClientData[]> => {
  const db = await getFirestoreDB();
  const q = query(collection(db, rota), where("name", "==", name));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as RawClientData[];
};
