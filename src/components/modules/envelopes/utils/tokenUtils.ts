// Utilidades para manejar tokens
import { TOKEN_ADDRESSES } from "../constants";

/**
 * Obtiene el símbolo del token basado en su dirección de contrato
 */
export function getTokenSymbol(tokenContract: string): string {
  // XLM wrapper contract address en testnet
  if (tokenContract === TOKEN_ADDRESSES.XLM || tokenContract === "native") {
    return "XLM";
  }
  // USDC contract address en testnet
  if (tokenContract === TOKEN_ADDRESSES.USDC) {
    return "USDC";
  }
  // Fallback: mostrar dirección truncada
  return tokenContract.substring(0, 8) + "...";
}

/**
 * Verifica si una dirección de contrato es el wrapper de XLM
 */
export function isXLM(tokenContract: string): boolean {
  return tokenContract === TOKEN_ADDRESSES.XLM || tokenContract === "native";
}

/**
 * Verifica si una dirección de contrato es USDC
 */
export function isUSDC(tokenContract: string): boolean {
  return tokenContract === TOKEN_ADDRESSES.USDC;
}

/**
 * Verifica si un token contract es inválido (como "native")
 * Estos sobres no pueden usarse para depósitos/retiros porque el contrato necesita una dirección válida
 */
export function isInvalidTokenContract(tokenContract: string): boolean {
  return (
    tokenContract === "native" || !tokenContract || tokenContract.trim() === ""
  );
}
