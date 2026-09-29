// Never render provider messages or error_description from an OAuth response.
export function getSocialAuthErrorMessage(code: string): string {
  switch (code.toLowerCase()) {
    case "access_denied":
    case "user_cancelled":
      return "Přihlášení bylo zrušeno. Můžeš to zkusit znovu.";
    case "email_not_found":
      return "Služba neposkytla e-mail. Použij jiný způsob přihlášení nebo se zaregistruj e-mailem.";
    case "account_not_linked":
    case "unable_to_link_account":
    case "email_not_verified":
    case "email_does_not_match":
    case "account_already_linked_to_different_user":
      return "Účet nelze bezpečně propojit. Přihlas se původním způsobem, například e-mailem a heslem.";
    case "provider_not_found":
    case "oauth_provider_not_found":
      return "Tento způsob přihlášení teď není dostupný. Pokračuj e-mailem.";
    default:
      return "Přihlášení se nepodařilo. Zkus to znovu nebo pokračuj e-mailem.";
  }
}
