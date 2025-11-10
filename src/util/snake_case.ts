/**
 * Convierte un string a snake_case (minúsculas con guiones bajos)
 * Ejemplo: "Trip to Europe" -> "trip_to_europe"
 * Maneja caracteres especiales y espacios múltiples
 */
export function toSnakeCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") // Reemplaza espacios con guiones bajos
    .replace(/[^a-z0-9_]/g, "") // Elimina caracteres especiales que no sean alfanuméricos o guiones bajos
    .replace(/_+/g, "_") // Reemplaza múltiples guiones bajos consecutivos con uno solo
    .replace(/^_|_$/g, ""); // Elimina guiones bajos al inicio y final
}

/**
 * Trunca un string a un máximo de bytes (no caracteres)
 * Útil para campos que tienen límites de bytes como Symbol en Soroban (32 bytes máximo)
 * Maneja correctamente la codificación UTF-8 para evitar cortar caracteres por la mitad
 */
export function truncateToBytes(str: string, maxBytes: number): string {
  if (!str) return str;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Convertir a bytes
  const bytes = encoder.encode(str);

  // Si ya está dentro del límite, retornar tal cual
  if (bytes.length <= maxBytes) {
    return str;
  }

  // Truncar a maxBytes, pero asegurarse de no cortar un carácter UTF-8 por la mitad
  // Retroceder desde maxBytes hasta encontrar un byte que sea inicio de carácter válido
  let truncateLength = maxBytes;

  // Retroceder hasta encontrar un byte que sea inicio de carácter válido
  // Un byte es inicio de carácter si:
  // - Es ASCII (0xxxxxxx, < 0x80)
  // - Es inicio de multi-byte (11xxxxxx, >= 0xC0)
  // Los bytes continuadores tienen el patrón 10xxxxxx (>= 0x80 && < 0xC0)
  while (truncateLength > 0) {
    const byte = bytes[truncateLength - 1];
    // Si es ASCII o inicio de multi-byte, es válido
    if (byte < 0x80 || byte >= 0xc0) {
      break;
    }
    // Si es un byte continuador (10xxxxxx), retroceder
    truncateLength--;
  }

  // Si no encontramos un byte válido, truncar más conservadoramente
  if (truncateLength === 0) {
    truncateLength = Math.max(1, Math.floor(maxBytes * 0.9));
  }

  const truncatedBytes = bytes.slice(0, truncateLength);
  return decoder.decode(truncatedBytes);
}

/**
 * Convierte un string a snake_case y lo trunca a máximo 32 bytes
 * Útil para campos Symbol en contratos Soroban
 */
export function toSnakeCaseMax32(str: string): string {
  const snakeCase = toSnakeCase(str);
  return truncateToBytes(snakeCase, 32);
}
