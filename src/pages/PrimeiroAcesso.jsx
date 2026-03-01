import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";

export default function PrimeiroAcesso() {
  const navigate = useNavigate();

  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  async function handlePrimeiroAcesso() {
    try {
      setErro(null);
      setLoading(true);

      if (!nomeEmpresa.trim()) {
        throw new Error("Informe o nome da empresa");
      }
      if (!email.trim() || !senha) {
        throw new Error("Informe email e senha do administrador");
      }

      // 🚀 Cloud Function: cria empresa + ADM
      const functions = getFunctions();
      const criarEmpresaTrial = httpsCallable(functions, "criarEmpresaTrial");

      await criarEmpresaTrial({
        nomeEmpresa: nomeEmpresa.trim(),
        // opcionais
        cnpj: cnpj.trim(),
        telefone: telefone.trim(),
        // obrigatórios para criar o ADM
        email: email.trim(),
        senha,
      });

      // 🔴 PASSO CRÍTICO: troca de sessão
      await signOut(auth);
      await signInWithEmailAndPassword(auth, email.trim(), senha);

      // ✅ agora sim entra como ADM correto
      navigate("/home", { replace: true });
    } catch (e) {
      console.error(e);
      setErro(e?.message || "Erro no primeiro acesso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 420, margin: "0 auto" }}>
      <h2>Primeiro acesso</h2>
      <p>Crie sua conta e sua empresa.</p>

      <input
        value={nomeEmpresa}
        onChange={(e) => setNomeEmpresa(e.target.value)}
        placeholder="Nome da empresa (obrigatório)"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <input
        value={cnpj}
        onChange={(e) => setCnpj(e.target.value)}
        placeholder="CNPJ (opcional)"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <input
        value={telefone}
        onChange={(e) => setTelefone(e.target.value)}
        placeholder="Telefone (opcional)"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email do administrador"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      <input
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        placeholder="Senha"
        style={{ padding: 10, width: "100%", marginBottom: 10 }}
      />

      {erro && <p style={{ color: "red", marginBottom: 10 }}>{erro}</p>}

      <button
        onClick={handlePrimeiroAcesso}
        disabled={loading}
        style={{ padding: 12, width: "100%" }}
      >
        {loading ? "Criando..." : "Criar empresa"}
      </button>
    </div>
  );
}
