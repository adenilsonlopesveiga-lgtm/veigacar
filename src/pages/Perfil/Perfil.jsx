// src/pages/Perfil/Perfil.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { db, auth } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { getFunctions, httpsCallable } from "firebase/functions";

/* ================= ESTILOS ================= */
const styles = {
  container: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 0,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    background: "#020617",
    padding: 24,
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  voltar: {
    alignSelf: "flex-start",
    background: "transparent",
    color: "#60a5fa",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 10,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    color: "#fff",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 6,
    border: "none",
    marginBottom: 10,
  },
  btnSalvar: {
    width: "100%",
    padding: 14,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: 10,
  },
  btnSecundario: {
    width: "100%",
    padding: 12,
    background: "#020617",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: 8,
    fontSize: 14,
    cursor: "pointer",
    marginBottom: 10,
  },
  erro: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    background: "#7f1d1d",
    color: "#fff",
    fontSize: 12,
    width: "100%",
    textAlign: "center",
  },
  sucesso: {
    marginTop: 10,
    padding: 10,
    borderRadius: 6,
    background: "#065f46",
    color: "#fff",
    fontSize: 12,
    width: "100%",
    textAlign: "center",
  },
};

export default function Perfil() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const [nome, setNome] = useState("");
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  const [chaveGerada, setChaveGerada] = useState(null);
  const [loadingChave, setLoadingChave] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  /* 🔒 BLOQUEIO: SOMENTE ADM (SUPER ADMIN PASSA) */
  if (!userData || (userData.role !== "ADM" && !userData.isSuperAdmin)) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p style={{ color: "#fff" }}>Acesso não autorizado.</p>
          <button style={styles.btnSalvar} onClick={() => navigate("/home")}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (userData?.nome) setNome(userData.nome);
  }, [userData]);

  /* ================= SALVAR PERFIL ================= */
  async function handleSalvar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    try {
      await updateDoc(doc(db, "users", user.uid), {
        nome: nome.trim(),
      });

      setSucesso("Perfil atualizado com sucesso.");
    } catch (err) {
      console.error("ERRO AO SALVAR PERFIL:", err);
      setErro(err.message || "Erro ao salvar perfil");
    }
  }

  /* ================= RECUPERAR SENHA (EMAIL) ================= */
  async function handleRecuperarSenha() {
    setErro(null);
    setSucesso(null);

    try {
      setLoadingReset(true);
      await sendPasswordResetEmail(auth, user.email);
      setSucesso(
        "Enviamos um e-mail para você redefinir sua senha com segurança."
      );
    } catch (err) {
      console.error("ERRO AO ENVIAR EMAIL:", err);
      setErro("Erro ao enviar e-mail de redefinição de senha.");
    } finally {
      setLoadingReset(false);
    }
  }

  /* ================= GERAR CHAVE (SOMENTE SUPER ADMIN) ================= */
  async function handleGerarChave() {
    setErro(null);
    setSucesso(null);
    setChaveGerada(null);

    try {
      setLoadingChave(true);

      const functions = getFunctions();
      const gerarChave = httpsCallable(functions, "gerarChaveAcesso");

      const res = await gerarChave({
        durationMinutes: 365 * 24 * 60, // 1 ano
      });

      const codigo = res?.data?.codigo;

      if (!codigo) {
        throw new Error("A função não retornou a chave");
      }

      setChaveGerada(codigo);
      setSucesso("Chave gerada com sucesso.");
    } catch (err) {
      console.error("ERRO AO GERAR CHAVE:", err);
      setErro(err?.message || "Erro ao gerar chave");
    } finally {
      setLoadingChave(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.voltar} onClick={() => navigate("/home")}>
          ← Voltar
        </button>

        {/* ===== SUPER ADMIN ===== */}
        {userData?.isSuperAdmin && (
          <div style={{ marginBottom: 20, width: "100%" }}>
            <h3 style={{ color: "#fff" }}>Super Admin</h3>

            <button
              onClick={handleGerarChave}
              disabled={loadingChave}
              style={styles.btnSalvar}
            >
              {loadingChave ? "Gerando..." : "Gerar chave (1 ano)"}
            </button>

            {chaveGerada && (
              <p style={{ color: "#fff", marginTop: 10 }}>
                🔑 <strong>{chaveGerada}</strong>
              </p>
            )}
          </div>
        )}

        <h2 style={styles.title}>Meu Perfil</h2>

        <form onSubmit={handleSalvar} style={{ width: "100%" }}>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={styles.input}
            placeholder="Nome"
          />

          <input
            value={user?.email || ""}
            disabled
            style={styles.input}
          />

          <button style={styles.btnSalvar}>
            Salvar alterações
          </button>
        </form>

        <button
          onClick={handleRecuperarSenha}
          disabled={loadingReset}
          style={styles.btnSecundario}
        >
          {loadingReset
            ? "Enviando e-mail..."
            : "Alterar senha (via e-mail)"}
        </button>

        {erro && <div style={styles.erro}>{erro}</div>}
        {sucesso && <div style={styles.sucesso}>{sucesso}</div>}
      </div>
    </div>
  );
}
