import { onAuthStateChanged, signOut, type Auth, type User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth } from "../firebase";
import { AdminAccessError, hasAdminAccess } from "./adminService";
import {
  clearPersistedSession,
  getPersistedSessionStatus,
} from "./adminAuthSessionService";
import type { AuthUser } from "../types/Auth";

export async function signOutAndClearSession(auth: Auth): Promise<void> {
  await signOut(auth).catch(() => undefined);
  clearPersistedSession();
}

function mapFirebaseUser(user: FirebaseUser | null): AuthUser | null {
  return user ? { uid: user.uid, email: user.email, isAdmin: true } : null;
}

export async function resolveAuthorizedUser(
  auth: Auth,
  firebaseUser: FirebaseUser | null,
  options?: { forceRefresh?: boolean; throwOnDenied?: boolean }
): Promise<AuthUser | null> {
  if (!firebaseUser) {
    return null;
  }

  try {
    const isAdmin = await hasAdminAccess(firebaseUser, options?.forceRefresh === true);

    if (!isAdmin) {
      await signOutAndClearSession(auth);

      if (options?.throwOnDenied) {
        throw new AdminAccessError();
      }

      return null;
    }

    return mapFirebaseUser(firebaseUser);
  } catch (error) {
    await signOutAndClearSession(auth);

    if (error instanceof AdminAccessError) {
      throw error;
    }

    throw error;
  }
}

export async function fetchCurrentAdminUser(): Promise<AuthUser | null> {
  const auth = await getFirebaseAuth();

  if (!auth.currentUser) {
    clearPersistedSession();
  } else if (getPersistedSessionStatus() !== "valid") {
    await signOutAndClearSession(auth);
    return null;
  }

  const current = await resolveAuthorizedUser(auth, auth.currentUser, {
    forceRefresh: true,
  });

  if (current) {
    return current;
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        unsubscribe();

        if (firebaseUser && getPersistedSessionStatus() === "expired") {
          void signOutAndClearSession(auth).then(() => resolve(null));
          return;
        }

        if (!firebaseUser) {
          clearPersistedSession();
        }

        resolveAuthorizedUser(auth, firebaseUser).then(resolve).catch(reject);
      },
      reject
    );
  });
}

