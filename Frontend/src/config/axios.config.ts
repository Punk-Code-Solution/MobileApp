/**
 * Configuração do Axios
 * Cria uma instância do axios com configurações padrão
 */

import axios from 'axios';
import { API_BASE_URL } from './api.config';
import { getGlobalLogoutCallback } from '../../App';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@telemedicina:token';
const USER_DATA_KEY = '@telemedicina:userData';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    // O token será adicionado nos services individuais
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Erro com resposta do servidor
      const statusCode = error.response.status;
      
      // Se for erro 401 (não autorizado), token provavelmente expirou
      if (statusCode === 401) {
        
        // Remover token do storage
        try {
          await AsyncStorage.multiRemove([TOKEN_KEY, USER_DATA_KEY]);
        } catch (storageError) {
          console.error('Erro ao remover token do storage:', storageError);
        }
        
        // Chamar callback de logout se disponível
        const logoutCallback = getGlobalLogoutCallback();
        if (logoutCallback) {
          // Usar setTimeout para evitar problemas de sincronização
          setTimeout(() => {
            try {
              logoutCallback();
            } catch (callbackError) {
              console.error('Erro ao chamar callback de logout:', callbackError);
            }
          }, 100);
        }
      }
      
      return Promise.reject(error);
    } else if (error.request) {
      // Erro de rede - fornecer mais detalhes para debug
      const baseURL = error.config?.baseURL || 'servidor';
      const url = error.config?.url || '';
      console.error('Erro de conexão:', {
        baseURL,
        url,
        fullUrl: `${baseURL}${url}`,
        message: error.message,
      });
      return Promise.reject(new Error(`Erro de conexão. Verifique se o backend está rodando em ${baseURL}`));
    } else {
      // Outro erro
      return Promise.reject(error);
    }
  }
);

