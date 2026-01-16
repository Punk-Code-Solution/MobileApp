import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import { messageService } from '../services/api/message.service';
import { useToast } from '../hooks/useToast';
import AlertModal from '../components/AlertModal';

interface AppointmentDetailsModalProps {
  appointment: Appointment;
  token: string;
  userRole?: 'PATIENT' | 'PROFESSIONAL';
  onClose: () => void;
  onCancelSuccess?: () => void;
  onRateAppointment?: (appointment: Appointment) => void;
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

export default function AppointmentDetailsModal({
  appointment,
  token,
  userRole,
  onClose,
  onCancelSuccess,
  onRateAppointment,
  onSendMessage,
  hideSendMessage = false,
}: AppointmentDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [cancelConfirmModal, setCancelConfirmModal] = useState(false);
  const [completeConfirmModal, setCompleteConfirmModal] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });
  const { showToast } = useToast();
  // Refs para prevenir múltiplos cliques simultâneos
  const isCancelingRef = useRef(false);
  const isCompletingRef = useRef(false);
  const isSendingMessageRef = useRef(false);
  const doctorName = appointment.professional?.fullName || 'Médico';
  const specialtyName =
    appointment.professional?.specialties?.[0]?.specialty?.name || 'Especialista';
  const isCompleted = appointment.status === 'COMPLETED';
  const isCanceled = appointment.status === 'CANCELED';
  const isInProgress = appointment.status === 'IN_PROGRESS';
  const isScheduled = appointment.status === 'SCHEDULED' || appointment.status === 'PENDING_PAYMENT';
  const canCancel =
    appointment.status !== 'CANCELED' &&
    appointment.status !== 'COMPLETED' &&
    appointment.status !== 'IN_PROGRESS';
  const canComplete = 
    userRole === 'PROFESSIONAL' && 
    (isScheduled || isInProgress) && 
    !isCompleted && 
    !isCanceled;

  const handleCancel = () => {
    setCancelConfirmModal(true);
  };

  const confirmCancel = async () => {
    // Proteção contra múltiplos cliques
    if (isCancelingRef.current || loading) {
      return;
    }

    setCancelConfirmModal(false);
    isCancelingRef.current = true;
    setLoading(true);
    
    try {
      await appointmentService.cancelAppointment(token, appointment.id);
      setSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao cancelar:', error);
      if (!error.response) {
        showToast('Verifique sua conexão com a internet e tente novamente.', 'error');
        setLoading(false);
        isCancelingRef.current = false;
        return;
      }
      const errorMessage =
        error.response?.data?.message || 'Não foi possível cancelar a consulta.';
      setErrorModal({ visible: true, message: errorMessage });
    } finally {
      setLoading(false);
      isCancelingRef.current = false;
    }
  };

  const handleSendMessage = async () => {
    // Proteção contra múltiplos cliques
    if (isSendingMessageRef.current || loading) {
      return;
    }

    isSendingMessageRef.current = true;
    setLoading(true);
    
    try {
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
        showToast('Não foi possível iniciar a conversa. Tente novamente.', 'error');
      }
    } finally {
      setLoading(false);
      isSendingMessageRef.current = false;
    }
  };

  const handleRate = () => {
    if (onRateAppointment) {
      // Primeiro definir o estado da tela de avaliação
      onRateAppointment(appointment);
      // Depois fechar o modal (usar setTimeout para garantir que o estado seja atualizado)
      setTimeout(() => {
        onClose();
      }, 50);
    } else {
      showToast('Não foi possível abrir a tela de avaliação.', 'error');
    }
  };

  const handleComplete = () => {
    setCompleteConfirmModal(true);
  };

  const confirmComplete = async () => {
    // Proteção contra múltiplos cliques
    if (isCompletingRef.current || loading) {
      return;
    }

    setCompleteConfirmModal(false);
    isCompletingRef.current = true;
    setLoading(true);
    
    try {
      console.log('[APPOINTMENT-DETAILS] Finalizando consulta:', {
        appointmentId: appointment.id,
        appointmentStatus: appointment.status,
        professionalId: appointment.professional?.id,
      });
      await appointmentService.completeAppointment(token, appointment.id);
      setSuccessModal(true);
    } catch (error: any) {
      console.error('[APPOINTMENT-DETAILS] Erro ao finalizar consulta:', {
        error,
        message: error?.message,
        response: error?.response,
        status: error?.response?.status,
        data: error?.response?.data,
      });

      // Tratar diferentes tipos de erro
      let errorMessage = 'Não foi possível finalizar a consulta.';

      if (!error.response) {
        // Erro de rede ou timeout
        if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
          errorMessage = 'Tempo de espera esgotado. Verifique sua conexão e tente novamente.';
        } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else {
          errorMessage = 'Verifique sua conexão com a internet e tente novamente.';
        }
        showToast(errorMessage, 'error');
        setLoading(false);
        isCompletingRef.current = false;
        return;
      }

      // Erro com resposta do servidor
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      if (statusCode === 401) {
        errorMessage = 'Sua sessão expirou. Por favor, faça login novamente.';
      } else if (statusCode === 403) {
        errorMessage = responseData?.message || 'Você não tem permissão para finalizar esta consulta.';
      } else if (statusCode === 404) {
        errorMessage = 'Agendamento não encontrado.';
      } else if (statusCode === 400) {
        errorMessage = responseData?.message || 'Não é possível finalizar esta consulta.';
      } else if (statusCode >= 500) {
        errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
      } else {
        // Tentar extrair mensagem de erro do servidor
        if (responseData?.message) {
          if (Array.isArray(responseData.message)) {
            errorMessage = responseData.message.join(', ');
          } else {
            errorMessage = responseData.message;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      }

      setErrorModal({ visible: true, message: errorMessage });
    } finally {
      setLoading(false);
      isCompletingRef.current = false;
    }
  };

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
              {canComplete && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.completeButton]}
                  onPress={handleComplete}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>FINALIZAR CONSULTA</Text>
                  )}
                </TouchableOpacity>
              )}
              {isCompleted && userRole === 'PATIENT' && (
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
              {isCanceled && userRole === 'PATIENT' && (
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

      {/* Modal de Confirmação de Finalização */}
      <AlertModal
        visible={completeConfirmModal}
        title="Finalizar Consulta"
        message={`Deseja realmente finalizar a consulta com ${appointment.patient?.fullName || 'o paciente'}?`}
        type="info"
        confirmText="Sim, Finalizar"
        cancelText="Não"
        showCancel={true}
        onConfirm={confirmComplete}
        onCancel={() => setCompleteConfirmModal(false)}
      />

      {/* Modal de Confirmação de Cancelamento */}
      <AlertModal
        visible={cancelConfirmModal}
        title="Cancelar Consulta"
        message={`Deseja realmente cancelar a consulta com ${doctorName}?`}
        type="warning"
        confirmText="Sim, Cancelar"
        cancelText="Não"
        showCancel={true}
        onConfirm={confirmCancel}
        onCancel={() => setCancelConfirmModal(false)}
      />

      {/* Modal de Sucesso */}
      <AlertModal
        visible={successModal}
        title="Sucesso! ✅"
        message="Operação realizada com sucesso."
        type="success"
        onConfirm={() => {
          setSuccessModal(false);
          onCancelSuccess?.();
          onClose();
        }}
      />

      {/* Modal de Erro */}
      <AlertModal
        visible={errorModal.visible}
        title="Erro"
        message={errorModal.message}
        type="error"
        onConfirm={() => setErrorModal({ visible: false, message: '' })}
      />
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
  completeButton: {
    backgroundColor: '#4CAF50',
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

