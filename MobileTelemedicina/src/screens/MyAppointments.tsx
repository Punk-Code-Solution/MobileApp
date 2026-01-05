import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import AppointmentDetailsModal from './AppointmentDetailsModal';

const API_URL = 'http://10.0.2.2:3000';

interface MyAppointmentsProps {
  token: string;
  onBack?: () => void;
  onNavigateToChat?: (professionalId: string, professionalName: string, professionalAvatar?: string) => void;
}

type TabType = 'upcoming' | 'history';

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

export default function MyAppointments({ token, onBack, onNavigateToChat }: MyAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/appointments/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAppointments(response.data);
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error);
      if (!error.response) {
        console.log('Erro de rede ao carregar agendamentos');
        return;
      }
      const errorMessage =
        error.response?.data?.message || 'Não foi possível carregar seus agendamentos.';
      Alert.alert('Erro', errorMessage);
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

  // Filtrar consultas baseado na tab ativa
  const filteredAppointments = appointments.filter((appointment) => {
    const now = new Date();
    const appointmentDate = new Date(appointment.scheduledAt);
    const isCompleted = appointment.status === 'COMPLETED';
    const isCanceled = appointment.status === 'CANCELED';
    const isPast = appointmentDate < now;

    if (activeTab === 'upcoming') {
      return !isCompleted && !isCanceled && !isPast;
    } else {
      return isCompleted || isCanceled || isPast;
    }
  });

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    const doctorName = item.professional?.fullName || 'Médico';
    const specialtyName =
      item.professional?.specialties?.[0]?.specialty?.name || 'Especialista';
    const statusLabel =
      item.status === 'COMPLETED'
        ? 'Realizado'
        : item.status === 'CANCELED'
        ? 'Cancelado'
        : 'Agendada';
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
        <View style={styles.cardContent}>
          <Text style={styles.specialty}>{specialtyName}</Text>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.date}>{formatDate(item.scheduledAt)}</Text>
            <Text style={styles.time}>{formatTime(item.scheduledAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
      
      {/* Header Azul */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Olá, Usuário!</Text>
            <Text style={styles.subtitle}>Verifique aqui suas consultas</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.tabTextActive,
              ]}
            >
              Próximas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'history' && styles.tabTextActive,
              ]}
            >
              Histórico
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de Consultas */}
      <View style={styles.content}>
        <Text style={styles.title}>Minhas consultas</Text>
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentCard}
          contentContainerStyle={[
            styles.list,
            filteredAppointments.length === 0 && styles.emptyListContainer,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming'
                  ? 'Nenhuma consulta agendada'
                  : 'Nenhuma consulta no histórico'}
              </Text>
              <Text style={styles.emptyText}>
                {activeTab === 'upcoming'
                  ? 'Quando você agendar uma consulta, ela aparecerá aqui.'
                  : 'Suas consultas anteriores aparecerão aqui.'}
              </Text>
            </View>
          }
        />
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
          onSendMessage={(professionalId, professionalName, professionalAvatar) => {
            if (onNavigateToChat) {
              onNavigateToChat(professionalId, professionalName, professionalAvatar);
            }
            setSelectedAppointment(null);
          }}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
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
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#90EE90',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  time: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
