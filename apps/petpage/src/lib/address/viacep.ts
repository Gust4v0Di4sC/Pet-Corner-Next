export type ViaCepAddress = {
  zipCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement: string;
};

type ViaCepResponse = {
  cep?: unknown;
  logradouro?: unknown;
  complemento?: unknown;
  bairro?: unknown;
  localidade?: unknown;
  uf?: unknown;
  erro?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function findAddressByZipCode(
  zipCode: string,
  signal?: AbortSignal
): Promise<ViaCepAddress | null> {
  const digits = zipCode.replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      signal,
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ViaCepResponse;
    if (payload.erro === true || payload.erro === "true") {
      return null;
    }

    return {
      zipCode: text(payload.cep),
      street: text(payload.logradouro),
      district: text(payload.bairro),
      city: text(payload.localidade),
      state: text(payload.uf).toUpperCase(),
      complement: text(payload.complemento),
    };
  } catch {
    return null;
  }
}
