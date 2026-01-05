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
      // Erro de rede
      return Promise.reject(new Error('Erro de conexão. Verifique sua internet.'));
    } else {
      // Outro erro
      return Promise.reject(error);
    }
  }
);

