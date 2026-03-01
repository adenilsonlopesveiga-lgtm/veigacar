import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 2000); // ⏱️ 2 segundos

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #020617, #000)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <img
        src="/logo-Gestão de Frotas.png"
        alt="Gestão de Frotas"
        style={{
          height: 200,
          marginBottom: 20,
        }}
      />

      <p style={{ color: "#94a3b8", fontSize: 14 }}>
        Controle de Serviços e Frotas
      </p>
    </div>
  );
}
