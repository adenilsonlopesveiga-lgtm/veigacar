import { useMemo } from "react";
import { useEmpresa } from "../contexts/EmpresaContext";
import { useAuth } from "../contexts/AuthContext";

export function useTrialStatus() {
  const { empresas, loadingEmpresas } = useEmpresa();
  const { userData } = useAuth();

  const status = useMemo(() => {
    /* ================= LOADING ================= */
    if (loadingEmpresas || !userData) {
      return {
        loading: true,
        isTrial: false,
        isBlocked: false,
        canCreate: false,
        message: null,
        daysRemaining: null,
      };
    }

    /* ================= SUPER ADM =================
       🔑 Super ADM nunca é bloqueado
       🔑 Nunca depende de empresa
    */
    if (userData.isSuperAdmin === true) {
      return {
        loading: false,
        isTrial: false,
        isBlocked: false,
        canCreate: true,
        message: null,
        daysRemaining: null,
      };
    }

    /* ================= SEM EMPRESA =================
       ⚠️ Segurança: se não houver empresa carregada,
       não bloqueia (evita travar usuário errado)
    */
    if (!empresas || empresas.length === 0) {
      return {
        loading: false,
        isTrial: false,
        isBlocked: false,
        canCreate: true,
        message: null,
        daysRemaining: null,
      };
    }

    /* ================= EMPRESA CORRETA =================
       ✅ CRÍTICO: pega APENAS a empresa do tenant do usuário
       ❌ nunca usar empresas[0]
    */
    const empresa = empresas.find(
  (e) => e.tenantId === userData.tenantId
);


    /* ================= EMPRESA NÃO ENCONTRADA =================
       ⚠️ Proteção contra dados inconsistentes
    */
    if (!empresa) {
  return {
    loading: false,
    isTrial: false,
    isBlocked: false,
    canCreate: true,
    message: null,
    daysRemaining: null,
  };
}


    const now = new Date();

    /* ================= EMPRESA DESATIVADA =================
       🔒 Aqui a desativação FUNCIONA DE VERDADE
       🔒 Bloqueia tudo, independente de trial/licença
    */
    if (empresa.active === false) {
      return {
        loading: false,
        isTrial: false,
        isBlocked: true,
        canCreate: false,
        message: "Empresa desativada",
        daysRemaining: null,
      };
    }

    /* ================= TRIAL ATIVO ================= */
    if (empresa.trialActive && empresa.trialEndsAt?.toDate) {
      const ends = empresa.trialEndsAt.toDate();

      if (ends > now) {
        const diffMs = ends - now;
        const minutes = Math.ceil(diffMs / 60000);

        return {
          loading: false,
          isTrial: true,
          isBlocked: false,
          canCreate: true,
          message: `Teste ativo • ${minutes} min restantes`,
          daysRemaining: minutes,
        };
      }
    }

    /* ================= LICENÇA ATIVA ================= */
    if (empresa.licenseActive === true) {
      if (
        !empresa.licenseEndsAt ||
        empresa.licenseEndsAt.toDate() > now
      ) {
        return {
          loading: false,
          isTrial: false,
          isBlocked: false,
          canCreate: true,
          message: "Licença ativa",
          daysRemaining: null,
        };
      }
    }

    /* ================= BLOQUEADO =================
       🔒 Trial expirado + licença inativa/expirada
    */
    return {
      loading: false,
      isTrial: false,
      isBlocked: true,
      canCreate: false,
      message: "Licença expirada",
      daysRemaining: null,
    };
  }, [empresas, loadingEmpresas, userData]);

  return status;
}
