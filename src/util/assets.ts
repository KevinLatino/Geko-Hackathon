// Stellar Asset Configuration
// These are the official testnet issuers

export const ASSET_ISSUERS = {
  TESTNET: {
    USDC: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  PUBLIC: {
    USDC: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  }
};

export function getUSDCIssuer(network: string = "TESTNET"): string {
  if (network.toUpperCase() === "PUBLIC") {
    return ASSET_ISSUERS.PUBLIC.USDC;
  }
  return ASSET_ISSUERS.TESTNET.USDC;
}

