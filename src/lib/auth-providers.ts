import "server-only";

type SocialAuthEnvironment = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
};

export type AuthProviderAvailability = { google: boolean; facebook: boolean };

// Keep credentials on the server. Only availability may cross the RSC boundary.
export function createSocialAuthConfig(env: SocialAuthEnvironment) {
  const google = env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim()
    ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
    : undefined;
  const facebook = env.FACEBOOK_CLIENT_ID?.trim() && env.FACEBOOK_CLIENT_SECRET?.trim()
    ? { clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET }
    : undefined;

  return {
    socialProviders: { ...(google ? { google } : {}), ...(facebook ? { facebook } : {}) },
    availability: { google: !!google, facebook: !!facebook } satisfies AuthProviderAvailability,
  };
}
