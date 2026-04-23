import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import {
  ANIMALS_ROUTE,
  CLIENTS_ROUTE,
  DASHBOARD_ROUTE,
  PRODUCTS_ROUTE,
  SERVICES_ROUTE,
  TESTIMONIALS_ROUTE,
} from "./components/Dashboard/dashboard.domain";
import PrivateRoute from "./Private";

const LoginPage = lazy(() => import("./screens/Login/LoginPage"));
const ResetPasswordPage = lazy(() => import("./screens/Login/ResetPasswordPage"));
const HomePage = lazy(() => import("./screens/Home/HomePage"));
const ClientesPage = lazy(() => import("./screens/Clientes/ClientesPage"));
const AnimaisPage = lazy(() => import("./screens/Animais/AnimaisPage"));
const ProdutosPage = lazy(() => import("./screens/Produtos/ProdutosPage"));
const ServicosPage = lazy(() => import("./screens/Servicos/ServicosPage"));
const DepoimentosPage = lazy(() => import("./screens/Depoimentos/DepoimentosPage"));
const NotFoundPage = lazy(() => import("./screens/NotFound/NotFoundPage"));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        color: "#1a2f3a",
        background: "#fdf6f2",
        fontWeight: 700,
      }}
      role="status"
      aria-live="polite"
    >
      Carregando...
    </div>
  );
}

export default function RoutesApp() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

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

        <Route
          path={SERVICES_ROUTE}
          element={
            <PrivateRoute>
              <ServicosPage />
            </PrivateRoute>
          }
        />

        <Route
          path={TESTIMONIALS_ROUTE}
          element={
            <PrivateRoute>
              <DepoimentosPage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
