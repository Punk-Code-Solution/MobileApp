/**
 * Serviço de mensagens
 * Centraliza todas as chamadas de API relacionadas a mensagens
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Conversation } from '../../types/message.types';

export const messageService = {
  /**
   * Busca todas as conversas do usuário
   */
  async getConversations(token: string): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>(API_ENDPOINTS.MESSAGES.CONVERSATIONS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Busca mensagens de uma conversa
   */
  async getMessages(token: string, conversationId: string): Promise<any[]> {
    const response = await api.get(`${API_ENDPOINTS.MESSAGES.BASE}/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Envia uma mensagem
   */
  async sendMessage(token: string, conversationId: string, text: string): Promise<void> {
    await api.post(
      `${API_ENDPOINTS.MESSAGES.BASE}/${conversationId}`,
      { text },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
};

