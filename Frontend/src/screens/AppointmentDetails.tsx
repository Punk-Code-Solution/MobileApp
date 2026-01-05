import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import Header from '../components/Header';
import { appointmentService } from '../services/api/appointment.service';

interface AppointmentDetailsProps {
  appointment: Appointment;
  token: string;
  onBack: () => void;
  onCancelSuccess?: () => void;
}

// Função para formatar data completa
const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${weekday}, ${day} de ${month} de ${year}`;
};

// Função para formatar horário
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Função para obter label do status
const getStatusLabel = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    PENDING_PAYMENT: 'Aguardando Pagamento',
    SCHEDULED: 'Agendada',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CANCELED: 'Cancelada',
  };
  return statusMap[status] || status;
};

// Função para obter cor do badge de status
const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return {
        backgroundColor: '#FFF3CD',
        color: '#856404',
        borderColor: '#FFE69C',
      };
    case 'SCHEDULED':
      return {
        backgroundColor: '#D1ECF1',
        color: '#0C5460',
        borderColor: colors.primary,
      };
    case 'IN_PROGRESS':
      return {
        backgroundColor: '#D1ECF1',
        color: colors.primary,
        borderColor: colors.primary,
      };
    case 'COMPLETED':
      return {
        backgroundColor: '#D4EDDA',
        color: '#155724',
        borderColor: '#C3E6CB',
      };
    case 'CANCELED':
      return {
        backgroundColor: '#F8D7DA',
        color: '#721C24',
        borderColor: '#F5C6CB',
      };
    default:
      return {
        backgroundColor: colors.gray,
        color: colors.textPrimary,
        borderColor: colors.gray,
      };
  }
};

export default function AppointmentDetails({
  appointment,
  token,
  onBack,
  onCancelSuccess,
}: AppointmentDetailsProps) {
  const [loading, setLoading] = useState(false);

  const statusBadge = getStatusBadgeStyle(appointment.status);
  const doctorName = appointment.professional?.fullName || 'Médico';
  const specialtyName =
    appointment.professional?.specialties?.[0]?.specialty?.name || 'Especialista';
  const licenseNumber = appointment.professional?.licenseNumber || 'N/A';
  const canCancel =
    appointment.status !== 'CANCELED' &&
    appointment.status !== 'COMPLETED' &&
    appointment.status !== 'IN_PROGRESS';
  const hasVideoLink = !!appointment.videoRoomUrl;

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
                    onBack();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('Erro ao cancelar:', error);
              
              // Tratar erro de rede
              if (!error.response) {
                Alert.alert(
                  'Sem Conexão',
                  'Verifique sua conexão com a internet e tente novamente.'
                );
                return;
              }
              
              const errorMessage =
                error.response?.data?.message ||
                'Não foi possível cancelar a consulta.';
              Alert.alert('Erro', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenVideoLink = () => {
    if (appointment.videoRoomUrl) {
      Linking.openURL(appointment.videoRoomUrl).catch((err) => {
        console.error('Erro ao abrir link:', err);
        Alert.alert('Erro', 'Não foi possível abrir o link da vídeo chamada.');
      });
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Detalhes da Consulta" onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card do Médico Melhorado */}
        <View style={styles.professionalCard}>
          <View style={styles.professionalHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBackground} />
              <Image
                source={{
                  uri:
                    appointment.professional?.avatarUrl ||
                    `https://ui-avatars.com/api/?background=4C4DDC&color=fff&size=128&name=${encodeURIComponent(
                      doctorName
                    )}`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.professionalInfo}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              <Text style={styles.specialty}>{specialtyName}</Text>
              <Text style={styles.license}>CRM: {licenseNumber}</Text>
            </View>
          </View>
          {appointment.professional?.bio && (
            <Text style={styles.bio}>{appointment.professional.bio}</Text>
          )}
        </View>

        {/* Card de Data e Hora */}
        <View style={styles.infoCard}>
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateSection}>
              <Text style={styles.dateLabel}>Data</Text>
              <Text style={styles.dateValue}>
                {formatFullDate(appointment.scheduledAt)}
              </Text>
            </View>
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Horário</Text>
              <Text style={styles.timeValue}>
                {formatTime(appointment.scheduledAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Card de Status */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>Status</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusBadge.backgroundColor,
                borderColor: statusBadge.borderColor,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {getStatusLabel(appointment.status)}
            </Text>
          </View>
        </View>

        {/* Card de Preço */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionLabel}>Valor da Consulta</Text>
          <Text style={styles.priceValue}>
            R$ {Number(appointment.price).toFixed(2)}
          </Text>
        </View>

        {/* Link da Vídeo Chamada (se houver) */}
        {hasVideoLink && (
          <View style={styles.infoCard}>
            <Text style={styles.sectionLabel}>Vídeo Chamada</Text>
            <TouchableOpacity
              style={styles.videoLinkButton}
              onPress={handleOpenVideoLink}
            >
              <Text style={styles.videoLinkIcon}>📹</Text>
              <Text style={styles.videoLinkText}>Abrir Sala de Vídeo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botão de Cancelar (se aplicável) */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.cancelButton, loading && styles.cancelButtonDisabled]}
            onPress={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.cancelButtonText}>Cancelar Consulta</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  professionalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  avatarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 24,
    zIndex: 1,
  },
  professionalInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 6,
  },
  specialty: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  license: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  bio: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateSection: {
    flex: 1,
    marginRight: 12,
  },
  timeSection: {
    flex: 1,
    marginLeft: 12,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  dateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    lineHeight: 24,
  },
  timeLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  videoLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  videoLinkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  videoLinkText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 8,
    minHeight: 56,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});

