import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useAuth } from "../contexts/AuthContext";

/**
 * ======================================================
 *  ATIVAR LICENÇA — VIA CLOUD FUNCTION
 * ======================================================
 */
export default function AtivarLicenca() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAtivar() {
    try {
      setErro(null);
      setLoading(true);

      if (!codigo) {
        throw new Error("Informe a chave de acesso");
      }

      if (!userData?.tenantId) {
        throw new Error("Empresa não identificada");
      }

      // 🔓 Cloud Function
      const functions = getFunctions();
      const ativarLicenca = httpsCallable(
        functions,
        "ativarLicencaComChave"
      );

      await ativarLicenca({
        codigo: codigo.trim().toUpperCase(),
        tenantId: userData.tenantId,
      });

      // ✅ licença ativada → volta para home ADM
      navigate("/home", { replace: true });
    } catch (e) {
      console.error("ERRO AO ATIVAR LICENÇA:", e);
      setErro(e?.message || "Erro ao ativar licença");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 400, width: "100%" }}>
        <h2>Licença expirada</h2>

        <p style={{ marginBottom: 20 }}>
          Seu período de teste terminou.
          <br />
          Insira a chave para continuar usando o sistema.
        </p>

        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="CHAVE DE ACESSO"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            border: "none",
            marginBottom: 10,
          }}
        />

        {erro && (
          <div
            style={{
              background: "#7f1d1d",
              padding: 10,
              borderRadius: 6,
              marginBottom: 10,
            }}
          >
            {erro}
          </div>
        )}

        <button
          onClick={handleAtivar}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            background: "#2563eb",
            border: "none",
            borderRadius: 8,
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Ativando..." : "Ativar licença"}
        </button>

        <p style={{ marginTop: 20, fontSize: 14 }}>
          📞 WhatsApp: <strong>67 99293-3564</strong>
          <br />
          📧 Email: <strong>adenilsonlopesveiga@gmail.com</strong>
        </p>
      </div>
    </div>
  );
}
