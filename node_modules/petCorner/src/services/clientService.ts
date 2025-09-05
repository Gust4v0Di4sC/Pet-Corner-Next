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
import type { Client } from "../contexts/ClientContext";

// Buscar todos os clientes
export const getAllClients = async (rota: string) => {
  const db = await getFirestoreDB();
  const colRef = collection(db, rota);
  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Adicionar um cliente
export const addClient = async (rota: string, data: Omit<Client, "id">) => {
  const db = await getFirestoreDB();
  const colRef = collection(db, rota);

  // Converter "age" caso venha como Timestamp
  const preparedData = {
    ...data,
    age:
      data.age instanceof Timestamp
        ? data.age.toDate()
        : data.age ?? null,
  };

  const docRef = await addDoc(colRef, preparedData);
  return { id: docRef.id, ...preparedData };
};

// Atualizar um cliente existente
export const updateClient = async (
  rota: string,
  id: string,
  data: Omit<Client, "id">
) => {
  const db = await getFirestoreDB();
  const docRef = doc(db, rota, id);
  await setDoc(docRef, data, { merge: true });
};

// Deletar um cliente
export const deleteClient = async (rota: string, id: string) => {
  const db = await getFirestoreDB();
  const docRef = doc(db, rota, id);
  await deleteDoc(docRef);
};

// Buscar cliente pelo nome
export const searchClientByName = async (rota: string, name: string) => {
  const db = await getFirestoreDB();
  const q = query(collection(db, rota), where("name", "==", name));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Client[];
};
