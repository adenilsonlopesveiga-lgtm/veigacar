import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home", { replace: true });
    } catch (err) {
      setError("Email ou senha inválidos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Gestão de Frotas</h1>
        <p style={styles.subtitle}>Gestão de frotas e motoristas</p>

        {/* 🔐 FORMULÁRIO — APENAS LOGIN */}
        <form onSubmit={handleLogin} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {/* 🔹 AÇÕES AUXILIARES (FORA DO FORM) */}
        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: 14,
            cursor: "pointer",
            color: "#93c5fd",
          }}
          onClick={() => navigate("/primeiro-acesso")}
        >
          Primeiro acesso / Criar empresa
        </div>

        <button
          type="button"
          onClick={() => navigate("/recuperar-senha")}
          style={{
            background: "transparent",
            border: "none",
            color: "#60a5fa",
            marginTop: 10,
            cursor: "pointer",
          }}
        >
          Esqueci minha senha
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#020617",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    background: "#020617",
    padding: 24,
    borderRadius: 8,
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
    textAlign: "center",
  },
  title: {
    margin: 0,
    fontSize: 28,
    letterSpacing: 1,
    color: "#fff",
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 24,
    fontSize: 14,
    color: "#94a3b8",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  input: {
    padding: 12,
    borderRadius: 6,
    border: "none",
    outline: "none",
  },
  button: {
    padding: 12,
    borderRadius: 6,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  error: {
    marginTop: 16,
    color: "#f87171",
    fontSize: 14,
  },
};
