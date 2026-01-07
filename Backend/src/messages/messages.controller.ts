// src/messages/messages.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../common/guards';
import { CurrentUser, type CurrentUserPayload } from '../common/decorators';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /messages/conversations
   * Lista todas as conversas do usuário
   */
  @Get('conversations')
  getConversations(@CurrentUser() user: CurrentUserPayload) {
    return this.messagesService.getConversations(user.userId, user.role);
  }

  /**
   * GET /messages/conversations/:conversationId
   * Busca mensagens de uma conversa
   */
  @Get('conversations/:conversationId')
  getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.messagesService.getMessages(conversationId, user.userId, user.role);
  }

  /**
   * POST /messages/conversations/:conversationId
   * Envia uma mensagem em uma conversa
   */
  @Post('conversations/:conversationId')
  @HttpCode(HttpStatus.CREATED)
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.messagesService.sendMessage(
      conversationId,
      createMessageDto,
      user.userId,
      user.role,
    );
  }

  /**
   * GET /messages/appointments/:appointmentId/conversation
   * Busca ou cria conversa vinculada a uma consulta
   */
  @Get('appointments/:appointmentId/conversation')
  getOrCreateConversationByAppointment(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.messagesService.getOrCreateConversationByAppointment(
      appointmentId,
      user.userId,
      user.role,
    );
  }
}

