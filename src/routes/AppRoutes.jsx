import { Routes, Route, Navigate } from "react-router-dom";
import HomePublica from "../landing/HomePublica";
import ControleFrotas from "../pagespublic/ControleFrotas.jsx";
import ControleAbastecimento from "../pagespublic/ControleAbastecimento.jsx";
import ControleMotoristas from "../pagespublic/ControleMotoristas.jsx";
import ControleViagens from "../pagespublic/ControleViagens.jsx";

import { useAuth } from "../contexts/AuthContext";
import { useEmpresas } from "../contexts/EmpresaContext";
import { useTrialStatus } from "../hooks/useTrialStatus";

/* TELAS PRINCIPAIS */
import Login from "../pages/Login/Login";
import Home from "../pages/Home/Home";
import Perfil from "../pages/Perfil/Perfil";
import GpsAdm from "../pages/gps/GpsAdm";
import Relatorios from "../pages/relatorios/Relatorios";

/* 🔑 RECUPERAR SENHA (CORRIGIDO) */
import RecuperarSenha from "../pages/RecuperarSenha";

/* PRIMEIRO ACESSO / LICENÇA */
import PrimeiroAcesso from "../pages/PrimeiroAcesso";
import AtivarLicenca from "../pages/AtivarLicenca";

/* TELAS FUNCIONAIS */
import Abastecimento from "../pages/Abastecimento/Abastecimento";
import Empresa from "../pages/Empresa/Empresa";
import Veiculo from "../pages/Veiculo/Veiculo";
import Motorista from "../pages/Motorista/Motorista";
import CriarMotorista from "../pages/Motorista/CriarMotorista";

/* VIAGENS */
import ViagemMotorista from "../pages/viagens/ViagemMotorista";
import ViagensControle from "../pages/viagens/ViagensControle";

/* TELAS EM DESENVOLVIMENTO */
function EmDesenvolvimento({ titulo }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "#fff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 22,
      }}
    >
      {titulo} — em desenvolvimento
    </div>
  );
}

export default function AppRoutes() {
  const { user, userData, loading } = useAuth();
  const { primeiroAcesso, loadingEmpresas } = useEmpresas();
  const { isBlocked } = useTrialStatus();

  const role = userData?.role;
  const isSuperAdmin = userData?.isSuperAdmin === true;

  // ⏳ Aguarda auth + empresas
  if (loading || loadingEmpresas) return null;

  // 🚀 Primeiro acesso (não se aplica a super admin nem motorista)
  if (user && primeiroAcesso && role === "ADM" && !isSuperAdmin) {
    return <Navigate to="/primeiro-acesso" replace />;
  }

  // 🔒 BLOQUEIO APENAS PARA ADM DA EMPRESA
  const bloqueadoPorLicenca =
    isBlocked && role === "ADM" && !isSuperAdmin;

  return (
    <Routes>
      {/* ROTA RAIZ */}
      <Route path="/" element={<HomePublica />} />

      {/* LOGIN / ONBOARDING */}
      <Route path="/controle-de-frotas" element={<ControleFrotas />} />
      <Route path="/controle-de-abastecimento" element={<ControleAbastecimento />} />
      <Route path="/controle-de-motoristas" element={<ControleMotoristas />} />
      <Route path="/controle-de-viagens" element={<ControleViagens />} />

      <Route path="/login" element={<Login />} />
      <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
      <Route path="/ativar-licenca" element={<AtivarLicenca />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />

      {user ? (
        <>
          {/* HOME */}
          <Route path="/home" element={<Home />} />

          {/* ===== MOTORISTA (SEMPRE LIBERADO) ===== */}
          <Route path="/abastecimento" element={<Abastecimento />} />
          <Route path="/viagens" element={<ViagemMotorista />} />

          {/* ===== ADMINISTRATIVO ===== */}
          <Route
            path="/viagens-controle"
            element={
              bloqueadoPorLicenca ? (
                <Navigate to="/ativar-licenca" />
              ) : (
                <ViagensControle />
              )
            }
          />

          <Route
            path="/empresa"
            element={
              bloqueadoPorLicenca ? (
                <Navigate to="/ativar-licenca" />
              ) : (
                <Empresa />
              )
            }
          />

          <Route
            path="/veiculos"
            element={
              bloqueadoPorLicenca ? (
                <Navigate to="/ativar-licenca" />
              ) : (
                <Veiculo />
              )
            }
          />

          <Route
            path="/motoristas"
            element={
              bloqueadoPorLicenca ? (
                <Navigate to="/ativar-licenca" />
              ) : (
                <Motorista />
              )
            }
          />

          <Route
            path="/motoristas/criar"
            element={
              bloqueadoPorLicenca ? (
                <Navigate to="/ativar-licenca" />
              ) : (
                <CriarMotorista />
              )
            }
          />

          {/* GPS ADM — SEMPRE LIBERADO */}
          <Route path="/gps-adm" element={<GpsAdm />} />

          <Route
            path="/relatorios"
            element={
              bloqueadoPorLicenca ? (
                <Navigate to="/ativar-licenca" />
              ) : (
                <Relatorios />
              )
            }
          />

          <Route path="/perfil" element={<Perfil />} />

          {/* FUTURAS */}
          <Route
            path="/configuracoes"
            element={<EmDesenvolvimento titulo="Configurações" />}
          />

          {/* FALLBACK LOGADO */}
          <Route path="*" element={<Navigate to="/home" />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}
