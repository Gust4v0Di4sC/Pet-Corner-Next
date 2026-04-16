type FirebaseRuntimeConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

declare global {
  interface Window {
    __PETCORNER_RUNTIME_CONFIG__?: Partial<FirebaseRuntimeConfig>;
  }
}

function required(name: keyof FirebaseRuntimeConfig, value: string | undefined) {
  if (!value) {
    throw new Error(`Configuracao ausente em runtime-config.js: ${name}`);
  }

  return value;
}

export function getFirebaseRuntimeConfig(): FirebaseRuntimeConfig {
  if (typeof window === "undefined") {
    throw new Error("A configuracao do Firebase so pode ser carregada no navegador.");
  }

  const runtimeConfig = window.__PETCORNER_RUNTIME_CONFIG__;

  if (!runtimeConfig) {
    throw new Error("runtime-config.js nao foi carregado antes da aplicacao.");
  }

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
