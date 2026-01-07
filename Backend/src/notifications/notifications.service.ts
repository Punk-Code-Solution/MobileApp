// src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, userRole: string) {
    // Buscar notificações do usuário do banco de dados
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Converter para o formato esperado pelo frontend
    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      date: notification.createdAt.toISOString(),
      type: notification.type.toLowerCase() as 'appointment' | 'message' | 'reminder' | 'system',
      read: notification.read,
      appointmentId: notification.appointmentId || undefined,
      messageId: notification.messageId || undefined,
    }));
  }

  async markAsRead(notificationId: string, userId: string) {
    // Verificar se a notificação pertence ao usuário
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notificação não encontrada.');
    }

    // Marcar como lida
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return {
      id: updated.id,
      read: updated.read,
      message: 'Notificação marcada como lida.',
    };
  }

  async markAllAsRead(userId: string) {
    // Marcar todas as notificações do usuário como lidas
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return {
      message: 'Todas as notificações foram marcadas como lidas.',
    };
  }

  /**
   * Cria uma notificação (método público para uso por outros services)
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'APPOINTMENT' | 'MESSAGE' | 'REMINDER' | 'SYSTEM';
    appointmentId?: string;
    messageId?: string;
  }) {
    return await this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        appointmentId: data.appointmentId || null,
        messageId: data.messageId || null,
        read: false,
      },
    });
  }
}
