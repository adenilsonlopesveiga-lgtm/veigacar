import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState(null);
  const [erro, setErro] = useState(null);

  async function handleReset() {
    setErro(null);
    setMsg(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg("Email de redefinição enviado. Verifique sua caixa de entrada.");
    } catch (e) {
      setErro("Erro ao enviar email. Verifique o endereço informado.");
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "0 auto" }}>
      <h2>Recuperar senha</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu email"
        style={{ width: "100%", padding: 10, marginBottom: 10 }}
      />

      <button onClick={handleReset} style={{ width: "100%", padding: 12 }}>
        Enviar email
      </button>

      {msg && <p style={{ color: "green" }}>{msg}</p>}
      {erro && <p style={{ color: "red" }}>{erro}</p>}
    </div>
  );
}
