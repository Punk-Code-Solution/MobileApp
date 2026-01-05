/**
 * Tipos relacionados a mensagens
 */

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'image';
  imageUrl?: string;
}

export interface Conversation {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline: boolean;
}

