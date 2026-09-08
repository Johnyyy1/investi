import { describe, expect, it } from "vitest";
import { getAuthErrorMessage } from "./auth-error";

describe("getAuthErrorMessage", () => {
  it("explains duplicate email registration", () => {
    expect(getAuthErrorMessage({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" }, "Fallback")).toBe(
      "An account already exists for this email. Sign in instead.",
    );
  });

  it("does not reveal whether an invalid sign-in email exists", () => {
    expect(getAuthErrorMessage({ code: "USER_NOT_FOUND" }, "Fallback")).toBe("Email or password is incorrect.");
    expect(getAuthErrorMessage({ code: "INVALID_PASSWORD" }, "Fallback")).toBe("Email or password is incorrect.");
  });

  it("uses the service message for unexpected errors", () => {
    expect(getAuthErrorMessage({ message: "Service unavailable" }, "Fallback")).toBe("Service unavailable");
  });
});
