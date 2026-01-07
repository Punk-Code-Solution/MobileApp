import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import ChatScreen from './ChatScreen';
import { messageService } from '../services/api/message.service';

interface Conversation {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
}

interface MessagesScreenProps {
  token: string;
  initialConversation?: {
    professionalId?: string;
    conversationId?: string;
    professionalName: string;
    professionalAvatar?: string;
  } | null;
  onConversationOpened?: () => void;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
  onConversationsUpdated?: () => void;
}


export default function MessagesScreen({ token, initialConversation, onConversationOpened, onShowNotifications, unreadNotificationsCount = 0, onConversationsUpdated }: MessagesScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  // Quando uma conversa inicial é passada, encontrar ou criar e abrir
  useEffect(() => {
    if (!initialConversation) return;

    const openConversation = async () => {
      // Se tiver conversationId, buscar a conversa diretamente
      if (initialConversation.conversationId) {
        // Aguardar conversas serem carregadas
        if (conversations.length > 0) {
          const existingConversation = conversations.find(
            (conv) => conv.id === initialConversation.conversationId
          );

          if (existingConversation) {
            setSelectedConversation(existingConversation);
            onConversationOpened?.();
            return;
          }
        }
        
        // Se não encontrou, recarregar conversas e tentar novamente
        try {
          const updatedConversations = await messageService.getConversations(token);
          setConversations(updatedConversations);
          const found = updatedConversations.find(
            (conv) => conv.id === initialConversation.conversationId
          );
          if (found) {
            setSelectedConversation(found);
            onConversationOpened?.();
          }
        } catch (error) {
          console.error('Erro ao buscar conversa:', error);
        }
      } else if (initialConversation.professionalId && conversations.length > 0) {
        // Fallback: buscar por professionalId (comportamento antigo)
        const existingConversation = conversations.find(
          (conv) => conv.professionalId === initialConversation.professionalId
        );

        if (existingConversation) {
          setSelectedConversation(existingConversation);
          onConversationOpened?.();
        } else {
          // Se não existe, criar uma nova conversa e abrir
          const newConversation: Conversation = {
            id: `new-${initialConversation.professionalId}`,
            professionalId: initialConversation.professionalId,
            professionalName: initialConversation.professionalName,
            professionalAvatar: initialConversation.professionalAvatar,
            lastMessage: '',
            lastMessageTime: 'Agora',
            unreadCount: 0,
            isOnline: false,
          };
          setSelectedConversation(newConversation);
          onConversationOpened?.();
        }
      }
    };

    openConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversation, conversations, onConversationOpened, token]);

  const fetchConversations = useCallback(async () => {
    try {
      // Buscar conversas da API
      const conversationsData = await messageService.getConversations(token);
      setConversations(conversationsData);
      
      // Notificar atualização
      if (onConversationsUpdated) {
        onConversationsUpdated();
      }
    } catch (error: any) {
      // Se o endpoint não estiver disponível (404), retornar array vazio
      // Não logar erro se for 404 (endpoint ainda não implementado)
      if (error?.response?.status !== 404) {
        console.error('Erro ao buscar conversas:', error);
      }
      // Em caso de erro, retornar array vazio
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, onConversationsUpdated]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const handleConversationPress = (conversation: Conversation) => {
    // Marcar mensagens como lidas ao abrir o chat
    if (conversation.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
        )
      );
    }
    setSelectedConversation(conversation);
  };

  const handleBackFromChat = () => {
    setSelectedConversation(null);
    fetchConversations(); // Atualizar lista ao voltar
    
    // Atualizar contadores quando voltar do chat
    if (onConversationsUpdated) {
      onConversationsUpdated();
    }
  };

  // Memoizar a função onMessagesRead para evitar loops infinitos
  const handleMessagesRead = useCallback((conversationId: string) => {
    // Marcar mensagens como lidas quando o chat é aberto
    setConversations((prev) => {
      // Verificar se realmente precisa atualizar
      const needsUpdate = prev.some(
        (conv) => conv.id === conversationId && conv.unreadCount > 0
      );
      
      if (!needsUpdate) {
        return prev; // Não atualizar se não houver mudança
      }
      
      return prev.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      );
    });
    
    // Atualizar contadores
    if (onConversationsUpdated) {
      onConversationsUpdated();
    }
  }, [onConversationsUpdated]);

  // Se uma conversa foi selecionada, mostra a tela de chat
  if (selectedConversation) {
    // Converter Conversation do MessagesScreen para Conversation do ChatScreen
    const chatConversation = {
      id: selectedConversation.id,
      professionalId: selectedConversation.professionalId,
      professionalName: selectedConversation.professionalName,
      professionalAvatar: selectedConversation.professionalAvatar,
      isOnline: selectedConversation.isOnline,
    };
    
    return (
      <ChatScreen
        conversation={chatConversation}
        token={token}
        onBack={handleBackFromChat}
        onMessagesRead={handleMessagesRead}
      />
    );
  }

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                item.professionalAvatar ||
                `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                  item.professionalName
                )}`,
            }}
            style={styles.avatar}
          />
          {item.isOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.professionalName}>{item.professionalName}</Text>
            <Text style={styles.messageTime}>{item.lastMessageTime}</Text>
          </View>
          <View style={styles.messagePreview}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Azul */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Mensagens</Text>
            <Text style={styles.greeting}>Olá, Usuário!</Text>
            <Text style={styles.subtitle}>Seu histórico de mensagens</Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton} 
            activeOpacity={0.7}
            onPress={onShowNotifications}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Conversas */}
      <View style={styles.content}>
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={[
            styles.list,
            conversations.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Nenhuma mensagem</Text>
              <Text style={styles.emptyText}>
                Suas conversas aparecerão aqui quando você receber mensagens.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#90EE90',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  messageTime: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 8,
  },
  messagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

