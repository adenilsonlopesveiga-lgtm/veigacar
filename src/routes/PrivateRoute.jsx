import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // ⏳ ainda carregando auth
  if (loading) {
    return <div style={{ color: "#fff", textAlign: "center" }}>Carregando...</div>;
  }

  // 🔒 não logado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ logado
  return children;
}
