/**
 * Hook para gerenciar contadores de mensagens e notificações não lidas
 */

import { useState, useEffect, useCallback } from 'react';
import { notificationService, Notification } from '../services/api/notification.service';
import { messageService } from '../services/api/message.service';
import { Conversation } from '../types/message.types';

interface UnreadCounts {
  notifications: number;
  messages: number;
}

export function useUnreadCounts(token: string) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    notifications: 0,
    messages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      // Buscar notificações não lidas
      const notifications = await notificationService.getMyNotifications(token, true);
      const unreadNotifications = notifications.filter((n: Notification) => !n.read);

      // Buscar conversas e calcular mensagens não lidas
      let unreadMessages = 0;
      try {
        const conversations = await messageService.getConversations(token);
        unreadMessages = conversations.reduce((total: number, conv: Conversation) => {
          return total + (conv.unreadCount || 0);
        }, 0);
      } catch (error: any) {
        // Se o endpoint de mensagens não estiver disponível (404), usar 0
        // Não logar erro se for 404 (endpoint ainda não implementado)
        if (error?.response?.status !== 404) {
          console.log('Erro ao buscar conversas para contador:', error);
        }
        // Em caso de erro, usar 0 (sem mensagens não lidas)
        unreadMessages = 0;
      }

      // Atualizar apenas se os valores mudaram para evitar re-renders desnecessários
      setUnreadCounts((prev) => {
        const newCounts = {
          notifications: unreadNotifications.length,
          messages: unreadMessages,
        };
        // Só atualizar se os valores realmente mudaram
        if (prev.notifications !== newCounts.notifications || prev.messages !== newCounts.messages) {
          return newCounts;
        }
        return prev;
      });
    } catch (error) {
      console.error('Erro ao buscar contadores:', error);
      setUnreadCounts((prev) => {
        if (prev.notifications !== 0 || prev.messages !== 0) {
          return { notifications: 0, messages: 0 };
        }
        return prev;
      });
    } finally {
      setLoading((prev) => {
        if (prev) {
          return false;
        }
        return prev;
      });
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    const fetchData = async () => {
      await fetchUnreadCounts();
    };

    fetchData();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      if (isMounted) {
        fetchUnreadCounts();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, fetchUnreadCounts]);

  return {
    unreadCounts,
    loading,
    refresh: fetchUnreadCounts,
  };
}

