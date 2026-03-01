import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useTrialStatus } from "../../hooks/useTrialStatus";

/* ================= ESTILOS ================= */
const styles = {
  container: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #020617, #000)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "rgba(2,6,23,0.9)",
    borderRadius: 14,
    padding: 24,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    color: "#fff",
  },
  sair: {
    background: "transparent",
    border: "1px solid #334155",
    color: "#e5e7eb",
    padding: "6px 14px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    color: "#94a3b8",
    marginBottom: 20,
    fontSize: 14,
  },
  grid: {
    display: "grid",
    gap: 14,
  },
  button: {
    background: "#020617",
    border: "1px solid #1e293b",
    color: "#fff",
    padding: "18px 10px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: "bold",
    minHeight: 86,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  icon: {
    fontSize: 26,
    lineHeight: 1,
  },
  label: {
    fontSize: 13,
    textAlign: "center",
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { userData, loading } = useAuth();

  const role = userData?.role;
  const isSuperAdmin = role === "SUPER_ADM";
  const isAdmin = role === "ADM" || isSuperAdmin;

  const {
    isTrial,
    message,
    daysRemaining,
    canCreate,
    isBlocked,
  } = useTrialStatus();

  /* ===== AGUARDA PERFIL ===== */
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ textAlign: "center" }}>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  /* ===== REDIRECIONAMENTO CORRETO (useEffect) ===== */
  useEffect(() => {
    if (isBlocked && !isSuperAdmin) {
      navigate("/ativar-licenca", { replace: true });
    }
  }, [isBlocked, isSuperAdmin, navigate]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const logout = async () => {
  // limpa estados sensíveis
  // se tiver context:
  // resetEmpresa();
  // resetGps();

  await signOut(auth);
  navigate("/login");
};


  const colunas = isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)";

  const podeCriar = isSuperAdmin || canCreate;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img
          src="/logo.png"
          alt="Gestão de Frotas"
          style={{
            height: isMobile ? 150 : 200,
            display: "block",
            margin: "0 auto 16px",
          }}
        />

        {isAdmin && isTrial && (
          <div className="trial-warning">
            {message || `Teste ativo • ${daysRemaining} dias restantes`}
          </div>
        )}

        <button style={styles.sair} onClick={logout}>
          Sair
        </button>

        <p style={styles.subtitle}>Painel principal</p>

        <div style={{ ...styles.grid, gridTemplateColumns: colunas }}>
          <button style={styles.button} onClick={() => navigate("/abastecimento")}>
            <div style={styles.icon}>⛽</div>
            <div style={styles.label}>Abastecimento</div>
          </button>

          <button style={styles.button} onClick={() => navigate("/viagens")}>
            <div style={styles.icon}>🚗</div>
            <div style={styles.label}>Viagens</div>
          </button>

          {isAdmin && (
            <>
              <button style={styles.button} onClick={() => navigate("/empresa")}>
                <div style={styles.icon}>🏢</div>
                <div style={styles.label}>Empresa</div>
              </button>

              <button
                style={{ ...styles.button, opacity: podeCriar ? 1 : 0.5 }}
                disabled={!podeCriar}
                onClick={() => navigate("/veiculos")}
              >
                <div style={styles.icon}>🚚</div>
                <div style={styles.label}>Veículos</div>
              </button>

              <button style={styles.button} onClick={() => navigate("/motoristas")}>
                <div style={styles.icon}>👤</div>
                <div style={styles.label}>Motoristas</div>
              </button>

              <button
                style={{ ...styles.button, opacity: podeCriar ? 1 : 0.5 }}
                disabled={!podeCriar}
                onClick={() => navigate("/motoristas/criar")}
              >
                <div style={styles.icon}>➕</div>
                <div style={styles.label}>Cadastrar Motorista</div>
              </button>

              <button style={styles.button} onClick={() => navigate("/viagens-controle")}>
                <div style={styles.icon}>📋</div>
                <div style={styles.label}>Controle de Viagens</div>
              </button>

              <button style={styles.button} onClick={() => navigate("/relatorios")}>
                <div style={styles.icon}>📊</div>
                <div style={styles.label}>Relatórios</div>
              </button>

              <button style={styles.button} onClick={() => navigate("/gps-adm")}>
                <div style={styles.icon}>🧭</div>
                <div style={styles.label}>GPS ADM</div>
              </button>

              <button style={styles.button} onClick={() => navigate("/perfil")}>
                <div style={styles.icon}>⚙️</div>
                <div style={styles.label}>Meu Perfil</div>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
