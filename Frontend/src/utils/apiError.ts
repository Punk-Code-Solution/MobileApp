/**
 * Extrai texto legível da resposta de erro da API (Nest + HttpExceptionFilter).
 * O campo `message` pode ser string, array de strings ou (validação) array de objetos.
 */
function isGenericAxiosMessage(msg: string): boolean {
  return /^Request failed with status code \d+$/i.test(msg.trim());
}

export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente novamente.'): string {
  const err = error as {
    response?: { data?: Record<string, unknown> };
    message?: string;
  };

  const data = err?.response?.data;
  if (!data || typeof data !== 'object') {
    if (typeof err?.message === 'string' && err.message.length > 0 && !isGenericAxiosMessage(err.message)) {
      return err.message;
    }
    return fallback;
  }

  const raw = data.message;
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }

  if (Array.isArray(raw)) {
    const parts = raw.map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object' && 'constraints' in item) {
        const c = (item as { constraints?: Record<string, string> }).constraints;
        if (c && typeof c === 'object') {
          return Object.values(c).join(', ');
        }
      }
      try {
        return JSON.stringify(item);
      } catch {
        return String(item);
      }
    });
    const joined = parts.filter(Boolean).join(' ');
    if (joined.length > 0) return joined;
  }

  const nested = data.data as Record<string, unknown> | undefined;
  if (nested && typeof nested === 'object') {
    const m = nested.message;
    if (typeof m === 'string' && m.trim()) return m.trim();
  }

  if (typeof err?.message === 'string' && err.message.length > 0 && !isGenericAxiosMessage(err.message)) {
    return err.message;
  }

  return fallback;
}
