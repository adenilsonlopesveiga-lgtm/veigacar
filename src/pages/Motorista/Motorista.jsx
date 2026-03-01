import { useEffect, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { functions } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";

/* ================= ESTILOS ================= */
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 700,
    background: "#020617",
    padding: 24,
    borderRadius: 8,
    color: "#fff",
  },
  voltar: {
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    textAlign: "center",
    marginBottom: 20,
  },
  lista: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  item: {
    background: "#0f172a",
    padding: 12,
    borderRadius: 6,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  nome: {
    fontWeight: "bold",
  },
  email: {
    fontSize: 12,
    color: "#94a3b8",
  },
  btnExcluir: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: 12,
  },
  erro: {
    marginTop: 10,
    background: "#7f1d1d",
    padding: 10,
    borderRadius: 6,
    textAlign: "center",
    fontSize: 12,
  },
  vazio: {
    textAlign: "center",
    fontSize: 13,
    color: "#94a3b8",
  },
};

export default function Motoristas() {
  const navigate = useNavigate();
  const { userData, loading } = useAuth();

  const [motoristas, setMotoristas] = useState([]);
  const [erro, setErro] = useState(null);
  const [loadingLista, setLoadingLista] = useState(false);

  /* ===== AGUARDA PERFIL ===== */
  if (loading || !userData) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.vazio}>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  /* ===== PERMISSÃO ===== */
  const isAdmin =
    userData.role === "ADM" || userData.role === "SUPER_ADM";

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={styles.vazio}>Acesso restrito</p>
        </div>
      </div>
    );
  }

  /* ================= LISTAR MOTORISTAS ================= */
  useEffect(() => {
    async function carregar() {
      try {
        setLoadingLista(true);
        const listarMotoristas = httpsCallable(
          functions,
          "listarMotoristas"
        );

        const res = await listarMotoristas();
        setMotoristas(res.data.motoristas || []);
        setErro(null);
      } catch (err) {
        console.error(err);
        setErro("Erro ao carregar motoristas.");
      } finally {
        setLoadingLista(false);
      }
    }

    carregar();
  }, []);

  /* ================= EXCLUIR MOTORISTA ================= */
  async function handleExcluir(uid) {
    if (!window.confirm("Deseja excluir este motorista?")) return;

    try {
      const excluirMotorista = httpsCallable(
        functions,
        "excluirMotorista"
      );

      await excluirMotorista({ uid });
      setMotoristas((prev) => prev.filter((m) => m.uid !== uid));
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir motorista.");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.voltar} onClick={() => navigate("/home")}>
          ← Voltar
        </button>

        <h2 style={styles.title}>Motoristas</h2>

        {loadingLista && (
          <p style={styles.vazio}>Carregando motoristas...</p>
        )}

        {!loadingLista && motoristas.length === 0 && (
          <p style={styles.vazio}>Nenhum motorista cadastrado.</p>
        )}

        <div style={styles.lista}>
          {motoristas.map((m) => (
            <div key={m.uid} style={styles.item}>
              <div style={styles.info}>
                <span style={styles.nome}>{m.nome}</span>
                <span style={styles.email}>{m.email}</span>
              </div>

              <button
                style={styles.btnExcluir}
                onClick={() => handleExcluir(m.uid)}
              >
                Excluir
              </button>
            </div>
          ))}
        </div>

        {erro && <div style={styles.erro}>{erro}</div>}
      </div>
    </div>
  );
}
