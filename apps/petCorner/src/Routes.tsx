import { Navigate, Route, Routes } from "react-router";

import {
  ANIMALS_ROUTE,
  CLIENTS_ROUTE,
  DASHBOARD_ROUTE,
  PRODUCTS_ROUTE,
} from "./components/Dashboard/dashboard.domain";
import PrivateRoute from "./Private";
import AnimaisPage from "./screens/Animais/AnimaisPage";
import ClientesPage from "./screens/Clientes/ClientesPage";
import HomePage from "./screens/Home/HomePage";
import LoginPage from "./screens/Login/LoginPage";
import ProdutosPage from "./screens/Produtos/ProdutosPage";

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path={DASHBOARD_ROUTE}
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />

      <Route
        path={CLIENTS_ROUTE}
        element={
          <PrivateRoute>
            <ClientesPage />
          </PrivateRoute>
        }
      />

      <Route
        path={ANIMALS_ROUTE}
        element={
          <PrivateRoute>
            <AnimaisPage />
          </PrivateRoute>
        }
      />

      <Route
        path={PRODUCTS_ROUTE}
        element={
          <PrivateRoute>
            <ProdutosPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to={DASHBOARD_ROUTE} replace />} />
    </Routes>
  );
}
