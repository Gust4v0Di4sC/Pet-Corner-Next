import fs from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, getIdTokenResult, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";

function loadEnvironment() {
  return Object.fromEntries(
    fs
      .readFileSync(new URL("../.env", import.meta.url), "utf8")
      .split(/\r?\n/)
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

const email = process.env.PETCORNER_ADMIN_EMAIL?.trim();
const password = process.env.PETCORNER_ADMIN_PASSWORD;
if (!email || !password) {
  throw new Error("Defina PETCORNER_ADMIN_EMAIL e PETCORNER_ADMIN_PASSWORD.");
}

const env = loadEnvironment();
if (env.VITE_FIREBASE_PROJECT_ID !== "petcorner-219fc") {
  throw new Error(`Projeto recusado para seed: ${env.VITE_FIREBASE_PROJECT_ID || "nao definido"}.`);
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
});

const auth = getAuth(app);
const credential = await signInWithEmailAndPassword(auth, email, password);
const token = await getIdTokenResult(credential.user, true);
if (token.claims.admin !== true) {
  throw new Error("O usuario informado nao possui a claim admin.");
}

const products = {
  "prod-racao-premium-caes-15kg": {
    name: "Ração Premium para Cães Adultos 15 kg",
    code: "PC-RACAO-CAES-15KG",
    description: "Nutrição completa para cães adultos, com proteínas de alta digestibilidade.",
    category: "Alimentação",
    badge: "Mais vendido",
    imageUrl: "/assets/product-fallback.svg",
    price: 219.9,
    quantity: 24,
    isActive: true,
  },
  "prod-racao-gatos-castrados-3kg": {
    name: "Ração para Gatos Castrados 3 kg",
    code: "PC-RACAO-GATOS-3KG",
    description: "Fórmula balanceada para gatos castrados, com controle de minerais.",
    category: "Alimentação",
    badge: "Recomendado",
    imageUrl: "/assets/product-fallback.svg",
    price: 94.9,
    quantity: 30,
    isActive: true,
  },
  "prod-antipulgas-caes-10-20kg": {
    name: "Antipulgas para Cães de 10 a 20 kg",
    code: "PC-ANTIPULGAS-10-20",
    description: "Proteção prática contra pulgas para cães de médio porte.",
    category: "Saúde",
    badge: "Pronta entrega",
    imageUrl: "/assets/product-fallback.svg",
    price: 69.9,
    quantity: 16,
    isActive: true,
  },
  "prod-tapete-higienico-30un": {
    name: "Tapete Higiênico com 30 Unidades",
    code: "PC-TAPETE-30",
    description: "Alta absorção e controle de odores para ambientes internos.",
    category: "Higiene",
    badge: "Oferta",
    imageUrl: "/assets/product-fallback.svg",
    price: 39.9,
    quantity: 38,
    isActive: true,
  },
  "prod-areia-gatos-4kg": {
    name: "Areia Higiênica para Gatos 4 kg",
    code: "PC-AREIA-GATOS-4KG",
    description: "Granulado com boa absorção e formação rápida de torrões.",
    category: "Higiene",
    badge: "Pronta entrega",
    imageUrl: "/assets/product-fallback.svg",
    price: 36.9,
    quantity: 42,
    isActive: true,
  },
  "prod-mordedor-borracha": {
    name: "Mordedor de Borracha Resistente",
    code: "PC-MORDEDOR-01",
    description: "Brinquedo texturizado para diversão e enriquecimento ambiental.",
    category: "Brinquedos",
    badge: "Novo",
    imageUrl: "/assets/product-fallback.svg",
    price: 31.9,
    quantity: 28,
    isActive: true,
  },
};

const services = {
  "serv-banho-tosa-completo": {
    name: "Banho e Tosa Completo",
    category: "banho_tosa",
    description: "Banho, secagem, corte de unhas e acabamento higiênico com cuidado individual.",
    durationMinutes: 90,
    price: 89.9,
    isActive: true,
  },
  "serv-consulta-veterinaria": {
    name: "Consulta Veterinária Preventiva",
    category: "consulta_veterinaria",
    description: "Avaliação clínica e orientações preventivas para a saúde do seu pet.",
    durationMinutes: 45,
    price: 120,
    isActive: true,
  },
  "serv-taxi-pet": {
    name: "Táxi Pet Agendado",
    category: "taxi_pet",
    description: "Transporte seguro e agendado para consultas, banho e tosa.",
    durationMinutes: 30,
    price: 39.9,
    isActive: true,
  },
};

const testimonials = {
  "depoimento-mariana": {
    author: "Mariana Oliveira",
    role: "Tutora da Mel",
    content: "Atendimento cuidadoso e rápido. A Mel voltou tranquila e muito bem cuidada.",
    rating: 5,
    isActive: true,
  },
  "depoimento-rafael": {
    author: "Rafael Santos",
    role: "Tutor do Thor",
    content: "A equipe é atenciosa e o agendamento online facilitou muito a nossa rotina.",
    rating: 5,
    isActive: true,
  },
  "depoimento-camila": {
    author: "Camila Souza",
    role: "Tutora da Luna",
    content: "Produtos de qualidade, entrega organizada e excelente suporte durante a compra.",
    rating: 5,
    isActive: true,
  },
};

const db = getFirestore(app);
const batch = writeBatch(db);
const nowIso = new Date().toISOString();

for (const [id, data] of Object.entries(products)) {
  batch.set(doc(db, "prods", id), {
    ...data,
    productionSeed: true,
    updatedAt: serverTimestamp(),
    updatedAtIso: nowIso,
  }, { merge: true });
}

for (const [id, data] of Object.entries(services)) {
  batch.set(doc(db, "services", id), {
    ...data,
    productionSeed: true,
    updatedAt: serverTimestamp(),
    updatedAtIso: nowIso,
  }, { merge: true });
}

for (const [id, data] of Object.entries(testimonials)) {
  batch.set(doc(db, "testimonials", id), {
    ...data,
    productionSeed: true,
    updatedAt: serverTimestamp(),
    updatedAtIso: nowIso,
  }, { merge: true });
}

await batch.commit();

await setDoc(doc(db, "appointmentSettings", "default"), {
  timezone: "America/Sao_Paulo",
  slotIntervalMinutes: 30,
  minAdvanceHours: 2,
  maxDaysAhead: 30,
  weeklyAvailability: {
    "0": { enabled: false, startTime: "09:00", endTime: "13:00" },
    "1": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "2": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "3": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "4": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "5": { enabled: true, startTime: "09:00", endTime: "18:00" },
    "6": { enabled: true, startTime: "09:00", endTime: "13:00" },
  },
  productionSeed: true,
  updatedAt: serverTimestamp(),
  updatedAtIso: nowIso,
}, { merge: true });

console.log(JSON.stringify({
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  products: Object.keys(products).length,
  services: Object.keys(services).length,
  testimonials: Object.keys(testimonials).length,
  appointmentSettings: 1,
}));

await auth.signOut();
