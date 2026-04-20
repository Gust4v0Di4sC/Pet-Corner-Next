type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

type AppRuntimeConfig = FirebaseRuntimeConfig & {
  cosmosSyncUrl?: string;
  chatWorkerUrl?: string;
};

declare global {
  interface Window {
    __PETCORNER_RUNTIME_CONFIG__?: Partial<AppRuntimeConfig>;
  }
}

function required(name: keyof FirebaseRuntimeConfig, value: string | undefined) {
  if (!value) {
    throw new Error(`Configuração ausente em runtime-config.js: ${name}`);
  }

  return value;
}

function getRuntimeConfig(): Partial<AppRuntimeConfig> {
  if (typeof window === "undefined") {
    throw new Error("A configuração do Firebase só pode ser carregada no navegador.");
  }

  const runtimeConfig = window.__PETCORNER_RUNTIME_CONFIG__;

  if (!runtimeConfig) {
    throw new Error("runtime-config.js não foi carregado antes da aplicação.");
  }

  return runtimeConfig;
}

export function getFirebaseRuntimeConfig(): FirebaseRuntimeConfig {
  const runtimeConfig = getRuntimeConfig();

  return {
    apiKey: required("apiKey", runtimeConfig.apiKey),
    authDomain: required("authDomain", runtimeConfig.authDomain),
    projectId: required("projectId", runtimeConfig.projectId),
    storageBucket: required("storageBucket", runtimeConfig.storageBucket),
    messagingSenderId: required("messagingSenderId", runtimeConfig.messagingSenderId),
    appId: required("appId", runtimeConfig.appId),
    measurementId: runtimeConfig.measurementId,
  };
}

export function getCosmosSyncUrl(): string {
  const value = getRuntimeConfig().cosmosSyncUrl?.trim();

  if (!value) {
    throw new Error(
      "Configure VITE_COSMOS_SYNC_URL no ambiente para usar a sincronização via Cloudflare."
    );
  }

  return value;
}

export function getChatWorkerUrl(): string {
  const value = getRuntimeConfig().chatWorkerUrl?.trim();

  if (!value) {
    throw new Error("Configure VITE_CHAT_WORKER_URL no ambiente para usar o chat com Gemini.");
  }

  return value;
}

