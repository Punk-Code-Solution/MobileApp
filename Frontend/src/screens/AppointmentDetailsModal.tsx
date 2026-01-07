import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import { messageService } from '../services/api/message.service';
import RateAppointmentScreen from './RateAppointmentScreen';

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  token: string;
  onClose: () => void;
  onCancelSuccess?: () => void;
  onSendMessage?: (conversationId: string, professionalId: string, professionalName: string, professionalAvatar?: string) => void;
  hideSendMessage?: boolean; // Prop para ocultar o botão de enviar mensagem (usado no histórico)
}

// Função para formatar data (DD/MM/YYYY)
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Função para formatar horário (HH:MM)
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

type ModalState = 'details' | 'rate';

export default function AppointmentDetailsModal({
  appointment,
  token,
  onClose,
  onCancelSuccess,
  onSendMessage,
  hideSendMessage = false,
}: AppointmentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>('details');
  const doctorName = appointment.professional?.fullName || 'Médico';
  const specialtyName =
    appointment.professional?.specialties?.[0]?.specialty?.name || 'Especialista';
  const isCompleted = appointment.status === 'COMPLETED';
  const isCanceled = appointment.status === 'CANCELED';
  const canCancel =
    appointment.status !== 'CANCELED' &&
    appointment.status !== 'COMPLETED' &&
    appointment.status !== 'IN_PROGRESS';

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Consulta',
      `Deseja realmente cancelar a consulta com ${doctorName}?`,
      [
        {
          text: 'Não',
          style: 'cancel',
        },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await appointmentService.cancelAppointment(token, appointment.id);
              Alert.alert('Sucesso', 'Consulta cancelada com sucesso.', [
                {
                  text: 'OK',
                  onPress: () => {
                    onCancelSuccess?.();
                    onClose();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Erro ao cancelar:', error);
              if (!error.response) {
                Alert.alert(
                  'Sem Conexão',
                  'Verifique sua conexão com a internet e tente novamente.'
                );
                return;
              }
              const errorMessage =
                error.response?.data?.message || 'Não foi possível cancelar a consulta.';
              Alert.alert('Erro', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSendMessage = async () => {
    try {
      setLoading(true);
      
      // Buscar ou criar conversa vinculada à consulta
      const conversation = await messageService.getOrCreateConversationByAppointment(
        token,
        appointment.id
      );
      
      const professionalId = appointment.professional?.id || '';
      const professionalName = appointment.professional?.fullName || 'Médico';
      const professionalAvatar = appointment.professional?.avatarUrl;
      
      if (onSendMessage) {
        onSendMessage(conversation.id, professionalId, professionalName, professionalAvatar);
        onClose();
      }
    } catch (error: any) {
      console.error('Erro ao buscar/criar conversa:', error);
      
      // Se o endpoint não estiver disponível (404), usar fallback
      if (error?.response?.status === 404) {
        // Fallback: usar professionalId para navegar (comportamento antigo)
        const professionalId = appointment.professional?.id || '';
        const professionalName = appointment.professional?.fullName || 'Médico';
        const professionalAvatar = appointment.professional?.avatarUrl;
        
        if (onSendMessage) {
          onSendMessage('', professionalId, professionalName, professionalAvatar);
          onClose();
        }
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível iniciar a conversa. Tente novamente.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRate = () => {
    setModalState('rate');
  };

  const handleBackFromRate = () => {
    setModalState('details');
  };

  const handleRateSuccess = () => {
    setModalState('details');
    if (onCancelSuccess) {
      onCancelSuccess();
    }
  };

  // Tela de avaliação
  if (modalState === 'rate') {
    return (
      <RateAppointmentScreen
        appointment={appointment}
        token={token}
        onBack={handleBackFromRate}
        onSuccess={handleRateSuccess}
      />
    );
  }

  // Obter data/hora da consulta ou do cancelamento/conclusão
  const getActionDate = () => {
    if (isCompleted || isCanceled) {
      // Para consultas concluídas/canceladas, usar a data de criação ou atualização
      return formatDate(appointment.createdAt);
    }
    return formatDate(appointment.scheduledAt);
  };

  const getActionTime = () => {
    if (isCompleted || isCanceled) {
      const date = new Date(appointment.createdAt);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }
    return formatTime(appointment.scheduledAt);
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Informações do Médico */}
            <View style={styles.professionalHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri:
                      appointment.professional?.avatarUrl ||
                      `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                        doctorName
                      )}`,
                  }}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.professionalInfo}>
                <Text style={styles.specialty}>{specialtyName}</Text>
                <Text style={styles.doctorName}>{doctorName}</Text>
                <View style={styles.dateTimeRow}>
                  <Text style={styles.dateTimeText}>
                    {formatDate(appointment.scheduledAt)}
                  </Text>
                  <Text style={styles.dateTimeText}>
                    {formatTime(appointment.scheduledAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Divisor */}
            <View style={styles.divider} />

            {/* Mensagem de Status */}
            {isCompleted && (
              <Text style={styles.statusMessage}>Você realizou essa consulta</Text>
            )}
            {isCanceled && (
              <Text style={styles.statusMessage}>Você cancelou essa consulta</Text>
            )}

            {/* Detalhes da Ação */}
            {(isCompleted || isCanceled) && (
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Data:</Text>
                  <Text style={styles.detailValue}>{getActionDate()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hora:</Text>
                  <Text style={styles.detailValue}>{getActionTime()}</Text>
                </View>
              </View>
            )}

            {/* Botões de Ação */}
            <View style={styles.actionsContainer}>
              {isCompleted && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleRate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonText}>AVALIAR CONSULTA</Text>
                </TouchableOpacity>
              )}
              {canCancel && (
                <>
                  {!hideSendMessage && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.messageButton]}
                      onPress={handleSendMessage}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionButtonText}>ENVIAR MENSAGEM</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancel}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.actionButtonText}>CANCELAR CONSULTA</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              {isCanceled && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.rateButtonDisabled]}
                  onPress={handleRate}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonTextDisabled}>AVALIAR CONSULTA</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxHeight: '80%',
    padding: 24,
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    padding: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingTop: 8,
  },
  professionalHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#90EE90',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  professionalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  specialty: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 20,
  },
  statusMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.text.primary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.primary,
  },
  rateButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  actionButtonTextDisabled: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

