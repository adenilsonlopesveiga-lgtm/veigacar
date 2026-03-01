import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { useNavigate } from "react-router-dom";
import { functions } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";



/* ================= ESTILOS ================= */

const styles = {
  container: {
  minHeight: "100vh",
  background: "#020617",   // 🔥 garante fundo preto total
  display: "flex",
  justifyContent: "flex-start", // 🔥 não centraliza vertical
  alignItems: "center",
  padding: 0,
  },

  form: {
  width: "100%",
  maxWidth: 360,     // 🔥 PADRÃO BOM (igual login)
  margin: "0 auto",  // 🔥 centraliza
},

  card: {
    width: "100%",
    maxWidth: 520,
    background: "#020617",
    padding: 24,
    borderRadius: 8,
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
    marginBottom: 10,
    textAlign: "center",
  },
  input: {
  width: "100%",
  padding: 12,
  borderRadius: 6,
  border: "none",
  marginBottom: 10,
  fontSize: 14,
  },
  btn: {
   width: "108%",          // 🔥 ISSO resolve
  padding: "14px",
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
  },
  erro: {
    marginTop: 10,
    background: "#7f1d1d",
    padding: 10,
    borderRadius: 6,
    textAlign: "center",
  },
  sucesso: {
    marginTop: 10,
    background: "#064e3b",
    padding: 10,
    borderRadius: 6,
    textAlign: "center",
    color: "#ecfeff",
  },
};


export default function CriarMotorista() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  // 🔒 Somente ADM
  const isAdmin =
  userData.role === "ADM" || userData.role === "SUPER_ADM";

if (!isAdmin) {
  return <p>Acesso restrito</p>;
}


  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  console.log("AUTH USER:", userData);


  /* ================= CRIAR MOTORISTA ================= */
  async function handleSalvar(e) {
    e.preventDefault();
    setErro(null);
    setSucesso(null);

    if (!nome || !email || !senha) {
      setErro("Preencha todos os campos.");
      return;
    }

    try {
      const criarMotorista = httpsCallable(functions, "criarMotorista");

      await criarMotorista({
        nome,
        email,
        senha,
        tenantId: userData.tenantId,
      });

      setNome("");
      setEmail("");
      setSenha("");
      setSucesso("Motorista criado com sucesso.");
    } catch (err) {
      console.error(err);
      setErro("Erro ao criar motorista.");
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <button style={styles.voltar} onClick={() => navigate("/home")}>
          ← Voltar
        </button>

        <h2 style={styles.title}>Cadastrar Motorista</h2>

        <form onSubmit={handleSalvar} style={styles.form}>

          <input
            placeholder="Nome do motorista"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            style={styles.input}
          />
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            placeholder="Senha inicial"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={styles.input}
          />

          <button style={styles.btn}>Criar motorista</button>
        </form>

        {erro && <div style={styles.erro}>{erro}</div>}
        {sucesso && <div style={styles.sucesso}>{sucesso}</div>}
      </div>
    </div>
  );
}
