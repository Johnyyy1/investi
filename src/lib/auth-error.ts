type AuthError = {
  code?: string;
  message?: string;
} | null | undefined;

export function getAuthErrorMessage(error: AuthError, fallback: string) {
  switch (error?.code) {
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account already exists for this email. Sign in instead.";
    case "USER_NOT_FOUND":
    case "INVALID_PASSWORD":
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email or password is incorrect.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "PASSWORD_TOO_SHORT":
      return "Use a password with at least 8 characters.";
    default:
      return error?.message ?? fallback;
  }
}
