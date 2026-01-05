import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import CallScreen from './CallScreen';
import VideoScreen from './VideoScreen';

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
}

// Dados mockados - substituir por chamada à API
const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt',
    senderId: 'professional',
    timestamp: '10:30',
    type: 'text',
  },
  {
    id: '2',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    senderId: 'user',
    timestamp: '10:32',
    type: 'text',
  },
  {
    id: '3',
    text: '',
    senderId: 'professional',
    timestamp: '10:33',
    type: 'image',
    imageUrl: 'https://via.placeholder.com/200x300/4A90E2/FFFFFF?text=X-Ray',
  },
  {
    id: '4',
    text: 'Lorem ipsum dolor sit amet',
    senderId: 'professional',
    timestamp: '10:35',
    type: 'text',
  },
  {
    id: '5',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit',
    senderId: 'user',
    timestamp: '10:36',
    type: 'text',
  },
];

type ScreenState = 'chat' | 'call' | 'video';

export default function ChatScreen({
  conversation,
  token,
  onBack,
}: ChatScreenProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');
  const [screenState, setScreenState] = useState<ScreenState>('chat');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Scroll para o final quando mensagens mudarem
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = () => {
    if (inputText.trim()) {
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.senderId === 'user';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.professionalMessageContainer,
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
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

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
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
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
    marginBottom: 4,
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
    marginBottom: 4,
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
});

