/**
 * Sistema de cache local para melhorar performance
 * Usa AsyncStorage para persistir dados no dispositivo
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@telemedicina_cache:';
const CACHE_EXPIRY_PREFIX = '@telemedicina_cache_expiry:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por padrão

interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
}

/**
 * Salva dados no cache com TTL opcional
 */
export async function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {},
): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
    const ttl = options.ttl || DEFAULT_TTL;
    const expiry = Date.now() + ttl;

    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    await AsyncStorage.setItem(expiryKey, expiry.toString());
  } catch (error) {
    console.error('Erro ao salvar no cache:', error);
  }
}

/**
 * Recupera dados do cache se ainda válidos
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

    const [cachedData, expiryStr] = await Promise.all([
      AsyncStorage.getItem(cacheKey),
      AsyncStorage.getItem(expiryKey),
    ]);

    if (!cachedData || !expiryStr) {
      return null;
    }

    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      // Cache expirado, remover
      await removeCache(key);
      return null;
    }

    return JSON.parse(cachedData) as T;
  } catch (error) {
    console.error('Erro ao recuperar do cache:', error);
    return null;
  }
}

/**
 * Remove dados do cache
 */
export async function removeCache(key: string): Promise<void> {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}`;
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;

    await Promise.all([
      AsyncStorage.removeItem(cacheKey),
      AsyncStorage.removeItem(expiryKey),
    ]);
  } catch (error) {
    console.error('Erro ao remover do cache:', error);
  }
}

/**
 * Limpa todo o cache
 */
export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(
      (key) =>
        key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_EXPIRY_PREFIX),
    );

    await AsyncStorage.multiRemove(cacheKeys);
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
  }
}

/**
 * Verifica se uma chave existe no cache e está válida
 */
export async function hasCache(key: string): Promise<boolean> {
  try {
    const expiryKey = `${CACHE_EXPIRY_PREFIX}${key}`;
    const expiryStr = await AsyncStorage.getItem(expiryKey);

    if (!expiryStr) {
      return false;
    }

    const expiry = parseInt(expiryStr, 10);
    return Date.now() <= expiry;
  } catch (error) {
    console.error('Erro ao verificar cache:', error);
    return false;
  }
}

/**
 * Cache keys comuns
 */
export const CACHE_KEYS = {
  APPOINTMENTS: 'appointments',
  PROFESSIONALS: 'professionals',
  NOTIFICATIONS: 'notifications',
  USER_PROFILE: 'user_profile',
} as const;

