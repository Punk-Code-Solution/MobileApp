/**
 * Utilitários para validação de token JWT
 * Decodifica e valida tokens JWT sem necessidade de biblioteca externa
 */

interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

/**
 * Decodifica base64 de forma compatível com React Native
 */
function base64Decode(str: string): string {
  try {
    // No React Native, podemos usar Buffer se disponível, ou fazer manualmente
    if (typeof atob !== 'undefined') {
      return atob(str);
    }
    
    // Fallback manual para React Native
    // Base64 charset
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    
    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');
    
    for (let i = 0; i < str.length; i += 4) {
      const enc1 = chars.indexOf(str.charAt(i));
      const enc2 = chars.indexOf(str.charAt(i + 1));
      const enc3 = chars.indexOf(str.charAt(i + 2));
      const enc4 = chars.indexOf(str.charAt(i + 3));
      
      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;
      
      output += String.fromCharCode(chr1);
      
      if (enc3 !== 64) {
        output += String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output += String.fromCharCode(chr3);
      }
    }
    
    return output;
  } catch (error) {
    console.error('Erro ao decodificar base64:', error);
    throw error;
  }
}

/**
 * Decodifica um token JWT (sem verificar assinatura)
 * Retorna o payload decodificado ou null se inválido
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decodificar o payload (segunda parte do JWT)
    const payload = parts[1];
    
    // Adicionar padding se necessário (base64url pode não ter padding)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    
    // Decodificar de base64
    const decoded = base64Decode(padded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

/**
 * Verifica se um token JWT está expirado
 * Retorna true se expirado, false se válido, null se não conseguir verificar
 */
export function isTokenExpired(token: string): boolean | null {
  try {
    const payload = decodeJwt(token);
    if (!payload || !payload.exp) {
      return null; // Não conseguiu decodificar ou não tem exp
    }

    // exp está em segundos Unix timestamp
    const expirationTime = payload.exp * 1000; // Converter para milissegundos
    const now = Date.now();

    // Considerar expirado se faltar menos de 1 minuto (margem de segurança)
    const margin = 60 * 1000; // 1 minuto em milissegundos
    return now >= (expirationTime - margin);
  } catch (error) {
    console.error('Erro ao verificar expiração do token:', error);
    return null;
  }
}

/**
 * Verifica se um token JWT é válido (não expirado)
 * Retorna true se válido, false se expirado ou inválido
 */
export function isTokenValid(token: string): boolean {
  const expired = isTokenExpired(token);
  if (expired === null) {
    return false; // Não conseguiu verificar, considerar inválido
  }
  return !expired;
}

