import { Navigate, Route, Routes } from "react-router";

import DashboardRecordsPage from "./components/Dashboard/DashboardRecordsPage";
import { DASHBOARD_ROUTE } from "./components/Dashboard/dashboard.domain";
import Home from "./components/Home/Home";
import PrivateRoute from "./Private";
import LoginPage from "./screens/Login/LoginPage";

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path={DASHBOARD_ROUTE}
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <PrivateRoute>
            <DashboardRecordsPage domain="clientes" />
          </PrivateRoute>
        }
      />

      <Route
        path="/caes"
        element={
          <PrivateRoute>
            <DashboardRecordsPage domain="animais" />
          </PrivateRoute>
        }
      />

      <Route
        path="/prods"
        element={
          <PrivateRoute>
            <DashboardRecordsPage domain="itens" />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to={DASHBOARD_ROUTE} replace />} />
    </Routes>
  );
}
