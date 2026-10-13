import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getFirebaseServerFirestore } from "@/lib/firebase/firebase-server";

const requiredText = (maxLength: number) => z.string().trim().min(1).max(maxLength);

const saveCustomerAddressSchema = z.object({
  zipCode: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8)
    .transform((value) => `${value.slice(0, 5)}-${value.slice(5)}`),
  street: requiredText(200),
  number: requiredText(30),
  district: requiredText(120),
  city: requiredText(120),
  state: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine((value) => /^[A-Z]{2}$/.test(value)),
  complement: z.string().trim().max(200).optional().default(""),
});

export type SaveCustomerAddressServerInput = z.infer<typeof saveCustomerAddressSchema>;

export type SavedCustomerAddress = SaveCustomerAddressServerInput & {
  customerId: string;
  updatedAtIso: string;
};

function formatAddressLabel(input: SaveCustomerAddressServerInput): string {
  const streetAndNumber = [input.street, input.number].filter(Boolean).join(", ");
  const cityAndState = [input.city, input.state].filter(Boolean).join(" - ");

  return [
    streetAndNumber,
    input.district,
    cityAndState,
    input.zipCode,
    input.complement,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function parseSaveCustomerAddressInput(input: unknown): SaveCustomerAddressServerInput {
  return saveCustomerAddressSchema.parse(input);
}

export async function saveCustomerAddressOnServer(input: {
  customerId: string;
  address: SaveCustomerAddressServerInput;
}): Promise<SavedCustomerAddress> {
  const customerId = input.customerId.trim();
  if (!customerId) {
    throw new Error("Sessao invalida para salvar o endereco.");
  }

  const address = saveCustomerAddressSchema.parse(input.address);
  const db = getFirebaseServerFirestore();
  const addressRef = db
    .collection("customers")
    .doc(customerId)
    .collection("addresses")
    .doc("delivery");
  const adminClientRef = db.collection("clientes").doc(customerId);
  const notificationRef = db
    .collection("customers")
    .doc(customerId)
    .collection("notifications")
    .doc();
  const nowIso = new Date().toISOString();
  const batch = db.batch();

  batch.set(
    addressRef,
    {
      customerId,
      ...address,
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtIso: nowIso,
    },
    { merge: true }
  );
  batch.set(
    adminClientRef,
    {
      ownerCustomerId: customerId,
      ...address,
      address: formatAddressLabel(address),
      source: "petpage",
      updatedAt: FieldValue.serverTimestamp(),
      updatedAtIso: nowIso,
    },
    { merge: true }
  );
  batch.set(notificationRef, {
    customerId,
    title: "Endereço atualizado",
    message: "Seu endereço de entrega foi atualizado com sucesso.",
    category: "profile",
    linkHref: "/profile",
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
    createdAtIso: nowIso,
  });

  await batch.commit();

  return {
    customerId,
    ...address,
    updatedAtIso: nowIso,
  };
}
