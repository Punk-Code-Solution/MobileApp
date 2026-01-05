/**
 * Configuração do Axios
 * Cria uma instância do axios com configurações padrão
 */

import axios from 'axios';
import { API_BASE_URL } from './api.config';

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
  (error) => {
    if (error.response) {
      // Erro com resposta do servidor
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

