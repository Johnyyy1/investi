type AuthError = {
  code?: string;
  message?: string;
} | null | undefined;

export function getAuthErrorMessage(error: AuthError, fallback: string) {
  switch (error?.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Pro tento e-mail už účet existuje. Přihlas se.";
    case "USER_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_EMAIL_OR_PASSWORD":
      return "E-mail nebo heslo není správně.";
    case "INVALID_EMAIL":
      return "Zadej platný e-mail.";
    case "PASSWORD_TOO_SHORT":
      return "Použij heslo dlouhé alespoň 8 znaků.";
    default:
      return error?.message ?? fallback;
  }
}
