"use client";

type OpenSessionInput = {
  name?: string;
  nextPath: string;
  idToken: string;
};

export type SessionResponse = {
  ok: boolean;
  nextPath: string;
  customerId: string;
};

export async function openCustomerSession(input: OpenSessionInput): Promise<SessionResponse> {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      authorization: `Bearer ${input.idToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      next: input.nextPath,
    }),
  });

  if (!response.ok) {
    throw new Error("Falha ao abrir sessao do cliente.");
  }

  const payload = (await response.json()) as
    | (SessionResponse & { session?: { customerId?: string } })
    | { ok?: boolean; nextPath?: string; session?: { customerId?: string } };

  return {
    ok: Boolean(payload.ok),
    nextPath: payload.nextPath || input.nextPath,
    customerId: payload.session?.customerId || "",
  };
}
