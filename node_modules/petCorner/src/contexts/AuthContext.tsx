import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import type { Auth } from "firebase/auth";
import {
  getFirebaseAuth,
  googleProvider,
  microsoftProvider,
} from "../firebase";
import { useNavigate } from "react-router";

type User = {
  uid: string;
  email: string | null;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithMicrosoft: () => Promise<boolean>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const navigate = useNavigate();

  // Carregar o auth dinamicamente
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getFirebaseAuth().then((firebaseAuth) => {
      setAuth(firebaseAuth);

      unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
          });
        } else {
          setUser(null);
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/clientes");
      return true;
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return false;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    if (!auth) return false;
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/clientes");
      return true;
    } catch (e) {
      console.error("Google login error:", e);
      return false;
    }
  };

  const loginWithMicrosoft = async (): Promise<boolean> => {
    if (!auth) return false;
    try {
      await signInWithPopup(auth, microsoftProvider);
      navigate("/clientes");
      return true;
    } catch (e) {
      console.error("Microsoft login error:", e);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, loginWithMicrosoft, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
