// src/messages/messages.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca todas as conversas do usuário
   * Retorna conversas vinculadas a consultas ou conversas diretas
   */
  async getConversations(userId: string, userRole: string) {
    // Buscar Patient ou Professional baseado no role
    let patientId: string | null = null;
    let professionalId: string | null = null;

    if (userRole === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        select: { id: true },
      });
      patientId = patient?.id || null;
    } else if (userRole === 'PROFESSIONAL') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId },
        select: { id: true },
      });
      professionalId = professional?.id || null;
    }

    if (!patientId && !professionalId) {
      return [];
    }

    // Buscar conversas
    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { patientId: patientId || undefined },
          { professionalId: professionalId || undefined },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            userId: true,
          },
        },
        professional: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            userId: true,
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            text: true,
            createdAt: true,
            senderId: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                read: false,
                senderId: {
                  not: userId, // Mensagens não lidas que não foram enviadas pelo usuário atual
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Formatar resposta para o frontend
    return conversations.map((conv) => {
      const lastMessage = conv.messages[0];
      const unreadCount = conv._count.messages;

      // Determinar o nome e avatar do outro participante
      const isPatient = userRole === 'PATIENT';
      const otherParticipant = isPatient ? conv.professional : conv.patient;
      const otherParticipantName = isPatient
        ? conv.professional.fullName
        : conv.patient.fullName;
      const otherParticipantAvatar = isPatient ? conv.professional.avatarUrl : undefined;

      return {
        id: conv.id,
        professionalId: conv.professionalId,
        professionalName: otherParticipantName,
        professionalAvatar: otherParticipantAvatar,
        lastMessage: lastMessage
          ? (lastMessage.text.length > 50
              ? lastMessage.text.substring(0, 50) + '...'
              : lastMessage.text)
          : '',
        lastMessageTime: lastMessage
          ? this.formatTime(lastMessage.createdAt)
          : '',
        unreadCount,
        isOnline: false, // TODO: Implementar status online
        appointmentId: conv.appointmentId,
      };
    });
  }

  /**
   * Busca mensagens de uma conversa
   */
  async getMessages(conversationId: string, userId: string, userRole: string) {
    // Verificar se a conversa existe e se o usuário tem permissão
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: { select: { userId: true } },
        professional: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Verificar permissão
    const hasPermission =
      conversation.patient.userId === userId || conversation.professional.userId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para acessar esta conversa');
    }

    // Buscar mensagens
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    // Marcar mensagens como lidas (apenas as que não foram enviadas pelo usuário atual)
    const unreadMessages = messages.filter(
      (msg) => !msg.read && msg.senderId !== userId,
    );

    if (unreadMessages.length > 0) {
      await this.prisma.message.updateMany({
        where: {
          id: { in: unreadMessages.map((msg) => msg.id) },
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    }

    // Formatar resposta
    return messages.map((msg) => ({
      id: msg.id,
      text: msg.text,
      senderId: msg.senderId === conversation.patient.userId ? 'user' : 'professional',
      timestamp: this.formatTime(msg.createdAt),
      type: 'text' as const,
    }));
  }

  /**
   * Envia uma mensagem
   */
  async sendMessage(
    conversationId: string,
    createMessageDto: CreateMessageDto,
    userId: string,
    userRole: string,
  ) {
    // Verificar se a conversa existe e se o usuário tem permissão
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        patient: { select: { userId: true } },
        professional: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada');
    }

    // Verificar permissão
    const hasPermission =
      conversation.patient.userId === userId || conversation.professional.userId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para enviar mensagens nesta conversa');
    }

    // Criar mensagem
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: userId,
        text: createMessageDto.text,
        read: false,
      },
    });

    // Atualizar updatedAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Criar notificação para o destinatário
    const recipientUserId =
      conversation.patient.userId === userId
        ? conversation.professional.userId
        : conversation.patient.userId;

    // Buscar nome do remetente
    let senderName = 'Usuário';
    if (userRole === 'PATIENT') {
      const patient = await this.prisma.patient.findUnique({
        where: { userId },
        select: { fullName: true },
      });
      senderName = patient?.fullName || 'Paciente';
    } else if (userRole === 'PROFESSIONAL') {
      const professional = await this.prisma.professional.findUnique({
        where: { userId },
        select: { fullName: true },
      });
      senderName = professional?.fullName || 'Profissional';
    }

    await this.prisma.notification.create({
      data: {
        userId: recipientUserId,
        title: 'Nova Mensagem',
        message: `${senderName}: ${createMessageDto.text.substring(0, 100)}${createMessageDto.text.length > 100 ? '...' : ''}`,
        type: 'MESSAGE',
        messageId: message.id,
        read: false,
      },
    });

    return {
      id: message.id,
      text: message.text,
      senderId: message.senderId === conversation.patient.userId ? 'user' : 'professional',
      timestamp: this.formatTime(message.createdAt),
      type: 'text' as const,
    };
  }

  /**
   * Cria ou retorna uma conversa vinculada a uma consulta
   */
  async getOrCreateConversationByAppointment(
    appointmentId: string,
    userId: string,
    userRole: string,
  ) {
    // Verificar se a consulta existe e se o usuário tem permissão
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: { select: { id: true, userId: true } },
        professional: { select: { id: true, userId: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Consulta não encontrada');
    }

    // Verificar permissão
    const hasPermission =
      appointment.patient.userId === userId || appointment.professional.userId === userId;

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para acessar esta consulta');
    }

    // Buscar conversa existente ou criar nova
    let conversation = await this.prisma.conversation.findUnique({
      where: { appointmentId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          appointmentId,
          patientId: appointment.patientId,
          professionalId: appointment.professionalId,
        },
      });
    }

    return conversation;
  }

  /**
   * Formata data/hora para exibição
   */
  private formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}

