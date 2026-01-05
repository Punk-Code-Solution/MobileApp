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
    const response = await api.get<{ data: Conversation[]; statusCode: number }>(API_ENDPOINTS.MESSAGES.CONVERSATIONS, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const conversations = response.data.data || response.data;
    return Array.isArray(conversations) ? conversations : [];
  },

  /**
   * Busca mensagens de uma conversa
   */
  async getMessages(token: string, conversationId: string): Promise<any[]> {
    const response = await api.get<{ data: any[]; statusCode: number }>(`${API_ENDPOINTS.MESSAGES.BASE}/${conversationId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const messages = response.data.data || response.data;
    return Array.isArray(messages) ? messages : [];
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

