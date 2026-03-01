import { useNavigate } from "react-router-dom";

export default function HomePublica() {
  const navigate = useNavigate();

  const styles = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #020617 0%, #0b1220 100%)",
      color: "#fff",
      padding: 0,
      fontFamily: "Arial, Helvetica, sans-serif",
    },

    hero: {
      textAlign: "center",
      padding: "100px 20px 70px",
      maxWidth: 1000,
      margin: "0 auto",
    },

    badge: {
      display: "inline-block",
      padding: "6px 12px",
      borderRadius: 999,
      background: "#0f172a",
      border: "1px solid #1e293b",
      color: "#93c5fd",
      fontSize: 13,
      marginBottom: 18,
    },

    heroTitle: {
      fontSize: 48,
      color: "#e2e8f0",
      fontWeight: "700",
      lineHeight: 1.2,
    },

    heroText: {
      marginTop: 18,
      fontSize: 20,
      color: "#94a3b8",
      maxWidth: 720,
      marginLeft: "auto",
      marginRight: "auto",
      lineHeight: 1.6,
    },

    btnRow: {
      marginTop: 36,
      display: "flex",
      justifyContent: "center",
      gap: 14,
      flexWrap: "wrap",
    },

    btnPrimary: {
      padding: "16px 36px",
      background: "#2563eb",
      border: "none",
      borderRadius: 12,
      fontSize: 18,
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 6px 22px rgba(37,99,235,.35)",
    },

    btnGhost: {
      padding: "16px 28px",
      background: "transparent",
      border: "2px solid #60a5fa",
      borderRadius: 12,
      fontSize: 18,
      color: "#60a5fa",
      fontWeight: "bold",
      cursor: "pointer",
    },

    section: {
      maxWidth: 1000,
      margin: "0 auto",
      padding: "20px",
    },

    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 18,
      marginTop: 40,
    },

    card: {
      background: "#0f172a",
      border: "1px solid #1e3a8a",
      padding: 22,
      borderRadius: 12,
      cursor: "pointer",
      transition: "0.2s",
    },

    cardTitle: {
      color: "#60a5fa",
      fontSize: 18,
      marginBottom: 8,
    },

    cardText: {
      color: "#cbd5f5",
      fontSize: 14,
    },

    pwaBox: {
      marginTop: 60,
      padding: 22,
      background: "#0f172a",
      border: "1px solid #2563eb",
      borderRadius: 12,
      maxWidth: 720,
      marginLeft: "auto",
      marginRight: "auto",
      textAlign: "center",
      boxShadow: "0 0 18px rgba(37,99,235,0.35)",
    },

    small: {
      marginTop: 12,
      color: "#94a3b8",
      fontSize: 14,
      textAlign: "center",
    },
  };

  return (
    <div style={styles.page}>

      {/* HERO */}
      <div style={styles.hero}>
        <span style={styles.badge}>
          Plataforma profissional de gestão de frotas
        </span>

        <h1 style={styles.heroTitle}>
          Tenha controle real dos seus veículos
        </h1>

        <p style={styles.heroText}>
          Abastecimentos, viagens, motoristas e relatórios em tempo real.
          Sua empresa organizada sem planilhas e sem papel.
        </p>

        <div style={styles.btnRow}>
          <button
            onClick={() => navigate("/primeiro-acesso")}
            style={styles.btnPrimary}
          >
            Testar grátis por 30 dias
          </button>

          <button
            onClick={() => navigate("/login")}
            style={styles.btnGhost}
          >
            Já tenho conta
          </button>
        </div>

        <p style={styles.small}>
          Sem cartão de crédito • Sem compromisso • Cancelamento imediato
        </p>
      </div>

      {/* FUNCIONALIDADES */}
      <div style={styles.section}>
        <h2 style={{ textAlign: "center", color: "#93c5fd", fontSize: 28 }}>
          Funcionalidades do Sistema
        </h2>

        <div style={styles.grid}>

          <div
            style={styles.card}
            onClick={() => navigate("/controle-de-frotas")}
          >
            <h3 style={styles.cardTitle}>Controle de Frotas</h3>
            <p style={styles.cardText}>
              Cadastro de veículos, acompanhamento operacional e gestão completa da frota.
            </p>
          </div>

          <div
            style={styles.card}
            onClick={() => navigate("/controle-de-abastecimento")}
          >
            <h3 style={styles.cardTitle}>Controle de Abastecimento</h3>
            <p style={styles.cardText}>
              Registro de combustível por motorista e veículo, detectando desperdícios.
            </p>
          </div>

          <div
            style={styles.card}
            onClick={() => navigate("/controle-de-motoristas")}
          >
            <h3 style={styles.cardTitle}>Controle de Motoristas</h3>
            <p style={styles.cardText}>
              Cada motorista com login próprio e histórico completo de utilização.
            </p>
          </div>

          <div
            style={styles.card}
            onClick={() => navigate("/controle-de-viagens")}
          >
            <h3 style={styles.cardTitle}>Controle de Viagens</h3>
            <p style={styles.cardText}>
              Registro de saídas, retornos, quilometragem e jornada de trabalho.
            </p>
          </div>

        </div>

        {/* PWA */}
        <div style={styles.pwaBox}>
          <h3 style={{ color: "#60a5fa", fontSize: 20, marginBottom: 12 }}>
            INSTALAÇÃO NO CELULAR (PWA)
          </h3>

          <p style={{ color: "#f1f5f9", fontSize: 16, lineHeight: 1.6 }}>
            Você pode instalar esta plataforma como aplicativo no celular e usar direto na tela inicial.
            <br /><br />
            Crie logins para seus motoristas utilizarem como operadores.
            <br /><br />
            Cadastre seus veículos ou frotas e tenha o controle total na palma da mão.
          </p>
        </div>
      </div>

    </div>
  );
}