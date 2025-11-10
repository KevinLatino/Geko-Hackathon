export const CONTRACT_ID =
  "CBHDPEFXULHHF3NO5EYALTUEZOFLKQ6GTCDG6MAFRWWKRVOHQHRVTLYZ";

// 🔹 Direcciones de los tokens (testnet wrappers)
// XLM usa un contrato wrapper en Soroban, no puede ser "native"
export const TOKEN_ADDRESSES = {
  XLM: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC", // XLM wrapper en testnet
  USDC: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA", // USDC en testnet
} as const;
