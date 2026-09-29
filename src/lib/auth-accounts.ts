export type LinkedAccount = {
  id: string;
  providerId: string;
};

export type LinkedAccountState = {
  credential?: LinkedAccount;
  google?: LinkedAccount;
  facebook?: LinkedAccount;
};

/** Keep provider internals out of the settings UI while retaining the local row id for unlinking. */
export function mapLinkedAccounts(accounts: readonly LinkedAccount[]): LinkedAccountState {
  const state: LinkedAccountState = {};
  for (const account of accounts) {
    if (account.providerId === "credential" || account.providerId === "google" || account.providerId === "facebook") {
      state[account.providerId] = account;
    }
  }
  return state;
}
