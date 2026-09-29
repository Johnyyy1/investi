import { describe, expect, it } from "vitest";
import { mapLinkedAccounts } from "./auth-accounts";

describe("mapLinkedAccounts", () => {
  it("keeps supported providers and their local account ids", () => {
    expect(mapLinkedAccounts([
      { id: "credential-row", providerId: "credential" },
      { id: "google-row", providerId: "google" },
      { id: "facebook-row", providerId: "facebook" },
      { id: "unknown-row", providerId: "some-provider" },
    ])).toEqual({
      credential: { id: "credential-row", providerId: "credential" },
      google: { id: "google-row", providerId: "google" },
      facebook: { id: "facebook-row", providerId: "facebook" },
    });
  });
});
