import { describe, expect, it } from "vitest";
import { createSocialAuthConfig } from "./auth-providers";
import { getSocialAuthErrorMessage } from "./social-auth-error";

describe("optional social authentication", () => {
  it("omits absent and incomplete providers", () => {
    for (const env of [{}, { GOOGLE_CLIENT_ID: "id" }, { GOOGLE_CLIENT_SECRET: "secret" },
      { FACEBOOK_CLIENT_ID: "id" }, { FACEBOOK_CLIENT_SECRET: "secret" },
      { GOOGLE_CLIENT_ID: " ", GOOGLE_CLIENT_SECRET: "secret" }]) {
      expect(createSocialAuthConfig(env)).toEqual({
        socialProviders: {}, availability: { google: false, facebook: false },
      });
    }
  });

  it("configures complete pairs independently and exposes only boolean availability", () => {
    const google = { GOOGLE_CLIENT_ID: "google-id", GOOGLE_CLIENT_SECRET: "google-secret" };
    const facebook = { FACEBOOK_CLIENT_ID: "facebook-id", FACEBOOK_CLIENT_SECRET: "facebook-secret" };
    expect(createSocialAuthConfig({ ...google, FACEBOOK_CLIENT_ID: "incomplete" })).toEqual({
      socialProviders: { google: { clientId: "google-id", clientSecret: "google-secret" } },
      availability: { google: true, facebook: false },
    });
    expect(createSocialAuthConfig(facebook).availability).toEqual({ google: false, facebook: true });
    const both = createSocialAuthConfig({ ...google, ...facebook });
    expect(Object.keys(both.socialProviders)).toEqual(["google", "facebook"]);
    expect(JSON.stringify(both.availability)).toBe('{"google":true,"facebook":true}');
  });

  it("normalizes failures without reflecting provider details", () => {
    expect(getSocialAuthErrorMessage("email_not_found")).toContain("Služba neposkytla e-mail");
    expect(getSocialAuthErrorMessage("account_not_linked")).toContain("původním způsobem");
    expect(getSocialAuthErrorMessage("access_denied")).toContain("zrušeno");
    expect(getSocialAuthErrorMessage("PROVIDER_NOT_FOUND")).toContain("není dostupný");
    expect(getSocialAuthErrorMessage("secret=private-token")).not.toContain("private-token");
  });
});
