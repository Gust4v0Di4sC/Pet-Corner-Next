"use client";

import { getAppCheckHeaders } from "@/lib/auth/firebase-auth.adapter";

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const appCheckHeaders = await getAppCheckHeaders();
  for (const [key, value] of Object.entries(appCheckHeaders)) headers.set(key, value);
  headers.set("X-Request-ID", crypto.randomUUID());
  return fetch(input, { ...init, headers });
}
