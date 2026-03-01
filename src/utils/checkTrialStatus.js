export function checkTrialStatus(empresa) {
  if (!empresa) {
    return { isBlocked: true };
  }

  const agora = new Date();

  // 🔒 LICENÇA ATIVA
  if (empresa.licenseActive && empresa.licenseEndsAt) {
    const fimLicenca = empresa.licenseEndsAt.toDate
      ? empresa.licenseEndsAt.toDate()
      : new Date(empresa.licenseEndsAt);

    if (fimLicenca > agora) {
      return {
        isBlocked: false,
        isTrial: false,
      };
    }

    // ❌ licença vencida
    return {
      isBlocked: true,
      isTrial: false,
      message: "Licença expirada",
    };
  }

  // 🧪 TRIAL
  if (empresa.trialActive && empresa.trialEndsAt) {
    const fimTrial = empresa.trialEndsAt.toDate
      ? empresa.trialEndsAt.toDate()
      : new Date(empresa.trialEndsAt);

    if (fimTrial > agora) {
      const diff =
        Math.ceil((fimTrial - agora) / (1000 * 60 * 60 * 24));

      return {
        isBlocked: false,
        isTrial: true,
        daysRemaining: diff,
        message: `Teste ativo • ${diff} dias restantes`,
      };
    }

    return {
      isBlocked: true,
      isTrial: false,
      message: "Período de teste encerrado",
    };
  }

  // ❌ SEM LICENÇA E SEM TRIAL
  return {
    isBlocked: true,
    isTrial: false,
    message: "Licença necessária",
  };
}
