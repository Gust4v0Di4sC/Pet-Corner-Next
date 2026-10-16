import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, it } from "vitest";
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-petcorner-quality",
    firestore: { rules: readFileSync(resolve("firestore.rules"), "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterEach(async () => env.clearFirestore());
afterAll(async () => env.cleanup());

describe("isolamento por cliente", () => {
  it("bloqueia anônimo e outro cliente", async () => {
    const ownerDb = env.authenticatedContext("customer-a").firestore();
    const otherDb = env.authenticatedContext("customer-b").firestore();
    const anonymousDb = env.unauthenticatedContext().firestore();
    const profile = { customerId: "customer-a", email: "a@example.com", name: "A", provider: "password" };
    await assertSucceeds(setDoc(doc(ownerDb, "customers/customer-a"), profile));
    await assertFails(getDoc(doc(otherDb, "customers/customer-a")));
    await assertFails(getDoc(doc(anonymousDb, "customers/customer-a")));
  });

  it("impede ownership divergente e permite administrador", async () => {
    const customerDb = env.authenticatedContext("customer-a").firestore();
    const adminDb = env.authenticatedContext("admin", { admin: true }).firestore();
    await assertFails(setDoc(doc(customerDb, "customers/customer-a/favorites/item"), {
      customerId: "customer-b", name: "Ração", price: 10,
    }));
    await assertSucceeds(setDoc(doc(adminDb, "prods/item"), { name: "Ração", price: 10 }));
  });
});
