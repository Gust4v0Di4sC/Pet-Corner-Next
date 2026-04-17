import { getIdTokenResult, type User as FirebaseUser } from "firebase/auth";

export class AdminAccessError extends Error {
  constructor(message = "Acesso restrito a administradores.") {
    super(message);
    this.name = "AdminAccessError";
  }
}

export async function hasAdminAccess(
  user: FirebaseUser,
  forceRefresh = false
): Promise<boolean> {
  const tokenResult = await getIdTokenResult(user, forceRefresh);
  return tokenResult.claims.admin === true;
}
