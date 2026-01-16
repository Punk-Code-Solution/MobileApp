import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import CallScreen from './CallScreen';
import VideoScreen from './VideoScreen';
import { messageService } from '../services/api/message.service';

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

interface Conversation {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalAvatar?: string;
  isOnline: boolean;
}

interface ChatScreenProps {
  conversation: Conversation;
  token: string;
  onBack: () => void;
  onMessagesRead?: (conversationId: string) => void;
}


type ScreenState = 'chat' | 'call' | 'video';

export default function ChatScreen({
  conversation,
  token,
  onBack,
  onMessagesRead,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('chat');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Buscar mensagens quando o chat é aberto
  const fetchMessages = useCallback(async () => {
    if (!conversation.id) return;
    
    try {
      setLoading(true);
      const messagesData = await messageService.getMessages(token, conversation.id);
      
      // O backend já retorna no formato correto: { id, text, senderId: 'user' | 'professional', timestamp, type }
      // Apenas garantir que seja um array
      const formattedMessages: Message[] = Array.isArray(messagesData) 
        ? messagesData.map((msg: any) => ({
            id: msg.id,
            text: msg.text,
            senderId: msg.senderId || 'professional', // 'user' ou 'professional'
            timestamp: msg.timestamp || new Date().toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            type: (msg.type || 'text') as 'text' | 'image',
          }))
        : [];
      
      setMessages(formattedMessages);
    } catch (error: any) {
      // Se o endpoint não estiver disponível (404), apenas logar
      if (error?.response?.status !== 404) {
        console.error('Erro ao buscar mensagens:', error);
      }
      // Em caso de erro, manter array vazio
      setMessages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversation.id, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    // Marcar mensagens como lidas quando o chat é aberto
    // Usar uma flag para garantir que só chame uma vez
    if (onMessagesRead && conversation.id) {
      onMessagesRead(conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]); // Remover onMessagesRead das dependências para evitar loops

  useEffect(() => {
    // Scroll para o final quando mensagens mudarem
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      try {
        // Enviar mensagem para a API
        await messageService.sendMessage(token, conversation.id, inputText.trim());
        
        // Buscar mensagens atualizadas
        const updatedMessages = await messageService.getMessages(token, conversation.id);
        setMessages(updatedMessages);
        setInputText('');
      } catch (error: any) {
        // Se o endpoint não estiver disponível (404), apenas logar
        if (error?.response?.status !== 404) {
          console.error('Erro ao enviar mensagem:', error);
        }
        // Em caso de erro, ainda adicionar localmente para feedback visual
        const newMessage: Message = {
          id: Date.now().toString(),
          text: inputText.trim(),
          senderId: 'user',
          timestamp: new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          type: 'text',
        };
        setMessages([...messages, newMessage]);
        setInputText('');
      }
    }
  };

  const handleCall = () => {
    setScreenState('call');
  };

  const handleVideoCall = () => {
    setScreenState('video');
  };

  const handleBackFromCall = () => {
    setScreenState('chat');
  };

  // Tela de chamada
  if (screenState === 'call') {
    return (
      <CallScreen
        professional={conversation}
        onBack={handleBackFromCall}
        onEndCall={handleBackFromCall}
      />
    );
  }

  // Tela de vídeo
  if (screenState === 'video') {
    return (
      <VideoScreen
        professional={conversation}
        onBack={handleBackFromCall}
        onEndCall={handleBackFromCall}
      />
    );
  }

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.senderId === 'user';
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const isSameSender = previousMessage?.senderId === item.senderId;
    const showSpacing = !isSameSender; // Mostrar espaço apenas quando muda o remetente

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.professionalMessageContainer,
          showSpacing && styles.messageContainerWithSpacing,
        ]}
      >
        {item.type === 'text' ? (
          <View
            style={[
              styles.messageBubble,
              isUser ? styles.userMessageBubble : styles.professionalMessageBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isUser ? styles.userMessageText : styles.professionalMessageText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        ) : (
          <View style={styles.imageMessage}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          </View>
        )}
        <Text style={styles.messageTime}>{item.timestamp}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Azul */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Image
            source={{
              uri:
                conversation.professionalAvatar ||
                `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                  conversation.professionalName
                )}`,
            }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{conversation.professionalName}</Text>
            <Text style={styles.headerStatus}>
              {conversation.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleVideoCall} style={styles.actionButton}>
            <Text style={styles.actionIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCall} style={styles.actionButton}>
            <Text style={styles.actionIcon}>📞</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Área de Mensagens */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyMessagesList,
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyMessagesContainer}>
                <Text style={styles.emptyMessagesText}>Nenhuma mensagem ainda</Text>
                <Text style={styles.emptyMessagesSubtext}>Envie uma mensagem para começar a conversa</Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Text style={styles.attachIcon}>+</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escreva aqui..."
            placeholderTextColor={colors.text.secondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} activeOpacity={0.7}>
            <Text style={styles.sendIcon}>🎤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primary,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#90EE90',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerStatus: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionIcon: {
    fontSize: 24,
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#F8F8FC',
  },
  messagesList: {
    padding: 12,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  messageContainerWithSpacing: {
    marginTop: 8,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  professionalMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 0,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  professionalMessageBubble: {
    backgroundColor: '#E5E5E5',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  professionalMessageText: {
    color: colors.text.primary,
  },
  imageMessage: {
    maxWidth: '75%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 0,
  },
  messageImage: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  messageTime: {
    fontSize: 11,
    color: colors.text.secondary,
    marginHorizontal: 4,
    marginTop: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  attachIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    fontSize: 14,
    color: colors.text.primary,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendIcon: {
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessagesList: {
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
});

