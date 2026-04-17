import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import AppLoader from "./components/Templates/AppLoader";
import { useAuth } from "./hooks/useAuth";

type PrivateRouteProps = {
  children: ReactNode;
};

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <AppLoader fullscreen message="Carregando interface..." />;
  }

  return user?.isAdmin ? children : <Navigate to="/" />;
};

export default PrivateRoute;
