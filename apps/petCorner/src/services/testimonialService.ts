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
import type { Testimonial } from "../types/testimonial";

export async function getAllTestimonials(rota: string = "testimonials"): Promise<Testimonial[]> {
  const db = await getFirestoreDB();
  const testimonialCollection = collection(db, rota);
  const snapshot = await getDocs(testimonialCollection);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Testimonial));
}

export async function addTestimonial(
  rota: string,
  data: Omit<Testimonial, "id">
): Promise<Testimonial> {
  const db = await getFirestoreDB();
  const testimonialCollection = collection(db, rota);
  const documentRef = await addDoc(testimonialCollection, data);
  return { id: documentRef.id, ...data };
}

export async function updateTestimonial(
  rota: string,
  id: string,
  data: Omit<Testimonial, "id">
): Promise<void> {
  const db = await getFirestoreDB();
  const documentRef = doc(db, rota, id);
  await setDoc(documentRef, data, { merge: true });
}

export async function deleteTestimonial(rota: string, id: string): Promise<void> {
  const db = await getFirestoreDB();
  const documentRef = doc(db, rota, id);
  await deleteDoc(documentRef);
}

export async function searchTestimonialByAuthor(
  rota: string,
  author: string
): Promise<Testimonial[]> {
  const db = await getFirestoreDB();
  const testimonialCollection = collection(db, rota);
  const collectionQuery = query(testimonialCollection, where("author", "==", author));
  const snapshot = await getDocs(collectionQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Testimonial));
}
