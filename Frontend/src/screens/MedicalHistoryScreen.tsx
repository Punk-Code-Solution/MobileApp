import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import AppointmentDetailsModal from './AppointmentDetailsModal';

interface MedicalHistoryScreenProps {
  token: string;
  onBack: () => void;
  onNavigateToChat?: (conversationIdOrProfessionalId: string, professionalName: string, professionalAvatar?: string) => void;
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

// Função para formatar data completa
const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekday = weekdays[date.getDay()];
  return `${weekday}, ${day}/${month}/${year}`;
};

export default function MedicalHistoryScreen({
  token,
  onBack,
  onNavigateToChat,
}: MedicalHistoryScreenProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getMyAppointments(token);
      const appointmentsArray = Array.isArray(data) ? data : [];
      
      // Filtrar apenas consultas completadas ou canceladas (histórico)
      const historyAppointments = appointmentsArray.filter((apt: Appointment) => {
        if (!apt || !apt.id) return false;
        const now = new Date();
        const appointmentDate = new Date(apt.scheduledAt);
        const isCompleted = apt.status === 'COMPLETED';
        const isCanceled = apt.status === 'CANCELED';
        const isPast = appointmentDate < now;
        return isCompleted || isCanceled || isPast;
      });

      // Ordenar por data (mais recente primeiro)
      historyAppointments.sort((a, b) => {
        const dateA = new Date(a.scheduledAt).getTime();
        const dateB = new Date(b.scheduledAt).getTime();
        return dateB - dateA;
      });

      setAppointments(historyAppointments);
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

  // Agrupar consultas por mês/ano
  const groupedAppointments = appointments.reduce((acc, appointment) => {
    const date = new Date(appointment.scheduledAt);
    const monthYear = `${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    const doctorName = item.professional?.fullName || 'Médico';
    const specialtyName = item.professional?.specialties?.[0]?.specialty?.name || 'Especialista';
    const statusLabel =
      item.status === 'COMPLETED'
        ? 'Realizado'
        : item.status === 'CANCELED'
        ? 'Cancelado'
        : 'Finalizado';
    const statusColor =
      item.status === 'COMPLETED'
        ? '#4CAF50'
        : item.status === 'CANCELED'
        ? '#F44336'
        : colors.primary;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => setSelectedAppointment(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  item.professional?.avatarUrl ||
                  `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                    doctorName
                  )}`,
              }}
              style={styles.avatar}
            />
          </View>
          <View style={styles.cardHeaderContent}>
            <Text style={styles.specialty}>{specialtyName}</Text>
            <Text style={styles.doctorName}>{doctorName}</Text>
            <Text style={styles.fullDate}>{formatFullDate(item.scheduledAt)}</Text>
            <Text style={styles.time}>{formatTime(item.scheduledAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.priceLabel}>Valor:</Text>
          <Text style={styles.price}>R$ {Number(item.price).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (monthYear: string, items: Appointment[]) => {
    return (
      <View key={monthYear} style={styles.section}>
        <Text style={styles.sectionTitle}>{monthYear}</Text>
        {items.map((appointment) => (
          <View key={appointment.id} style={styles.sectionItem}>
            {renderAppointmentCard({ item: appointment })}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Histórico Médico</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhum histórico encontrado</Text>
            <Text style={styles.emptyText}>
              Suas consultas anteriores aparecerão aqui quando forem finalizadas.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.list}>
              {Object.entries(groupedAppointments).map(([monthYear, items]) =>
                renderSection(monthYear, items)
              )}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Modal de Detalhes */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          token={token}
          onClose={() => setSelectedAppointment(null)}
          onCancelSuccess={() => {
            fetchAppointments();
            setSelectedAppointment(null);
          }}
          onSendMessage={(conversationId, professionalId, professionalName, professionalAvatar) => {
            if (onNavigateToChat) {
              // Se tiver conversationId, usar ele; senão usar professionalId (fallback)
              const idToUse = conversationId || professionalId;
              onNavigateToChat(idToUse, professionalName, professionalAvatar);
            }
            setSelectedAppointment(null);
          }}
          hideSendMessage={true}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  scrollView: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  sectionItem: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#90EE90',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  cardHeaderContent: {
    flex: 1,
  },
  specialty: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  fullDate: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  priceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

