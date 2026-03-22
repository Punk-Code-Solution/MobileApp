/**
 * Agendamentos — paciente e profissional usam a mesma tela de agenda diária (`AppointmentDetails`),
 * com comportamentos distintos por perfil (modal, chat, avaliação).
 */

import React from 'react';
import AppointmentDetails from './AppointmentDetails';

interface MyAppointmentsProps {
  token: string;
  userRole?: 'PATIENT' | 'PROFESSIONAL';
  onBack?: () => void;
  onNavigateToChat?: (
    conversationIdOrProfessionalId: string,
    professionalName: string,
    professionalAvatar?: string,
  ) => void;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export default function MyAppointments({
  token,
  userRole = 'PATIENT',
  onNavigateToChat,
  onShowNotifications,
  unreadNotificationsCount = 0,
}: MyAppointmentsProps) {
  return (
    <AppointmentDetails
      token={token}
      userRole={userRole === 'PROFESSIONAL' ? 'PROFESSIONAL' : 'PATIENT'}
      onNavigateToChat={onNavigateToChat}
      onShowNotifications={onShowNotifications}
      unreadNotificationsCount={unreadNotificationsCount}
    />
  );
}
