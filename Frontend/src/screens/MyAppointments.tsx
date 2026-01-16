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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import MedicalHistoryScreen from './MedicalHistoryScreen';
import RateAppointmentScreen from './RateAppointmentScreen';
import { appointmentService } from '../services/api/appointment.service';

const USER_DATA_KEY = '@telemedicina:userData';

interface MyAppointmentsProps {
  token: string;
  userRole?: 'PATIENT' | 'PROFESSIONAL';
  onBack?: () => void;
  onNavigateToChat?: (conversationIdOrProfessionalId: string, professionalName: string, professionalAvatar?: string) => void;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
}

type TabType = 'upcoming' | 'history';
type ScreenState = 'list' | 'history' | 'rate';

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

export default function MyAppointments({ token, userRole, onBack, onNavigateToChat, onShowNotifications, unreadNotificationsCount = 0 }: MyAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [ratingAppointment, setRatingAppointment] = useState<Appointment | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [hasAppointments, setHasAppointments] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>('list');
  const [userName, setUserName] = useState<string>('Usuário');

  // Buscar nome do usuário do AsyncStorage
  useEffect(() => {
    const loadUserName = async () => {
      try {
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          // Tentar obter o nome de diferentes formas
          const name = userData?.fullName || 
                      userData?.patient?.fullName || 
                      userData?.professional?.fullName || 
                      userData?.name ||
                      'Usuário';
          setUserName(name);
        }
      } catch (error) {
        console.error('Erro ao carregar nome do usuário:', error);
      }
    };
    loadUserName();
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getMyAppointments(token);
      // Garantir que sempre seja um array
      const appointmentsArray = Array.isArray(data) ? data : [];
      setAppointments(appointmentsArray);
      
      // Validação: Verificar se o usuário tem consultas vinculadas
      const hasValidAppointments = appointmentsArray.length > 0 && 
        appointmentsArray.some((apt: Appointment) => 
          apt && apt.id && (apt.patientId || apt.professionalId)
        );
      setHasAppointments(hasValidAppointments);
      
      // Se não houver consultas válidas, exibir mensagem informativa
      if (!hasValidAppointments && appointmentsArray.length === 0) {
        console.log('Usuário não possui consultas cadastradas vinculadas');
      }
    } catch (error: any) {
      console.error('Erro ao buscar agendamentos:', error);
      // Em caso de erro, definir como array vazio para evitar erros
      setAppointments([]);
      setHasAppointments(false);
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

  // Filtrar e ordenar consultas baseado na tab ativa
  // Garantir que appointments seja sempre um array antes de usar filter
  // Validação adicional: apenas exibir consultas válidas vinculadas ao usuário
  const filteredAppointments = (Array.isArray(appointments) ? appointments : [])
    .filter((appointment) => {
      // Validar se a consulta está vinculada ao usuário
      if (!appointment || !appointment.id || (!appointment.patientId && !appointment.professionalId)) {
        return false;
      }
      
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
    })
    .sort((a, b) => {
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      
      if (activeTab === 'upcoming') {
        // Para próximas: ordenar crescente (mais próximas primeiro)
        return dateA - dateB;
      } else {
        // Para histórico: ordenar decrescente (mais recentes primeiro)
        return dateB - dateA;
      }
    });

  const renderAppointmentCard = ({ item }: { item: Appointment }) => {
    // Validação: Verificar se a consulta está vinculada ao usuário
    if (!item || !item.id || (!item.patientId && !item.professionalId)) {
      console.warn('Consulta inválida ou não vinculada ao usuário:', item);
      return null;
    }

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

  // Tela de histórico detalhado
  if (screenState === 'history') {
    return (
      <MedicalHistoryScreen
        token={token}
        onBack={() => setScreenState('list')}
        onNavigateToChat={onNavigateToChat}
      />
    );
  }

  // Tela de avaliação
  if (ratingAppointment) {
    return (
      <RateAppointmentScreen
        appointment={ratingAppointment}
        token={token}
        onBack={() => {
          setRatingAppointment(null);
          setSelectedAppointment(null);
        }}
        onSuccess={() => {
          setRatingAppointment(null);
          setSelectedAppointment(null);
          fetchAppointments();
        }}
      />
    );
  }

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
            <Text style={styles.greeting}>Olá, {userName}!</Text>
            <Text style={styles.subtitle}>
              {userRole === 'PROFESSIONAL' 
                ? 'Gerencie suas consultas e pacientes' 
                : 'Verifique aqui suas consultas'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton} 
            activeOpacity={0.7}
            onPress={onShowNotifications}
          >
            <Text style={styles.notificationIcon}>🔔</Text>
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
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
            onLongPress={() => {
              // Long press para abrir tela detalhada
              const historyAppointments = appointments.filter((apt: Appointment) => {
                if (!apt || !apt.id) return false;
                const now = new Date();
                const appointmentDate = new Date(apt.scheduledAt);
                const isCompleted = apt.status === 'COMPLETED';
                const isCanceled = apt.status === 'CANCELED';
                const isPast = appointmentDate < now;
                return isCompleted || isCanceled || isPast;
              });
              if (historyAppointments.length > 0) {
                setScreenState('history');
              }
            }}
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
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Minhas consultas</Text>
          {activeTab === 'history' && filteredAppointments.length > 0 && (
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => setScreenState('history')}
              activeOpacity={0.7}
            >
              <Text style={styles.detailButtonText}>Ver Detalhado</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Validação: Exibir mensagem se não houver consultas vinculadas */}
        {!hasAppointments && !loading && (
          <View style={styles.validationMessage}>
            <Text style={styles.validationText}>
              Você precisa ter consultas cadastradas e vinculadas à sua conta para visualizá-las aqui.
            </Text>
          </View>
        )}
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
                {!hasAppointments
                  ? 'Você não possui consultas cadastradas'
                  : activeTab === 'upcoming'
                  ? 'Nenhuma consulta agendada'
                  : 'Nenhuma consulta no histórico'}
              </Text>
              <Text style={styles.emptyText}>
                {!hasAppointments
                  ? 'Você precisa ter consultas vinculadas à sua conta para visualizá-las aqui. Agende uma consulta primeiro.'
                  : activeTab === 'upcoming'
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
          userRole={userRole}
          onClose={() => setSelectedAppointment(null)}
          onCancelSuccess={() => {
            fetchAppointments();
            setSelectedAppointment(null);
          }}
          onRateAppointment={(appointment) => {
            // Primeiro definir a tela de avaliação
            setRatingAppointment(appointment);
            // Depois limpar o modal (isso vai fechar o modal)
            // Usar setTimeout para garantir que o estado seja atualizado antes de fechar
            setTimeout(() => {
              setSelectedAppointment(null);
            }, 50);
          }}
          onSendMessage={(conversationId, professionalId, professionalName, professionalAvatar) => {
            if (onNavigateToChat) {
              // Se tiver conversationId, usar ele; senão usar professionalId (fallback)
              const idToUse = conversationId || professionalId;
              onNavigateToChat(idToUse, professionalName, professionalAvatar);
            }
            setSelectedAppointment(null);
          }}
          hideSendMessage={activeTab === 'history'}
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  detailButton: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  detailButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  validationMessage: {
    backgroundColor: '#FFF3CD',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  validationText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});
