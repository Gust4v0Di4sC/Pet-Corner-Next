import { Routes, Route, Navigate } from "react-router";
import PrivateRoute from "./Private";
import LoginPage from "./screens/Login/LoginPage";
import Home from "./components/Home/Home";

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />

      <Route
        path="/clientes"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
