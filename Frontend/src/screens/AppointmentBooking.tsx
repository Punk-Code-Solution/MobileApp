import React, { useState, useRef, useEffect } from 'react';
import { useHardwareBackPress } from '../hooks/useHardwareBackPress';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Professional, CreateAppointmentDto } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import { isTokenValid } from '../utils/token.util';
import { getApiErrorMessage } from '../utils/apiError';
import { useToast } from '../hooks/useToast';
import AlertModal from '../components/AlertModal';

/** Mesmos tokens visuais da NewHomeScreen (categorias + chips de filtro) */
const PAGE_PAD = 22;
const NAVY = '#1A4A8E';

interface AppointmentBookingProps {
  professional: Professional;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Horários disponíveis (9h às 18h, intervalo de 30min)
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00',
];

// Gera próximos 14 dias a partir de hoje
const generateNextDays = (): Date[] => {
  const days: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset para meia-noite
  
  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
};

const formatDate = (date: Date): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.getTime() === today.getTime()) {
    return 'Hoje';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Amanhã';
  } else {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekday = weekdays[date.getDay()];
    return `${weekday}, ${day}/${month}`;
  }
};

const formatDayNumber = (date: Date): string => {
  return date.getDate().toString();
};

const formatMonth = (date: Date): string => {
  return (date.getMonth() + 1).toString();
};

/** Primeiro dia da lista (hoje), meia-noite local — igual a `generateNextDays()[0]`. */
const getInitialSelectedDate = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/** Horário ainda não permitido pelo backend (mín. 2h à frente do relógio local). */
const isTimeSlotAllowed = (day: Date, timeSlot: string): boolean => {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStart = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    hours,
    minutes,
    0,
    0,
  );
  const minTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
  return slotStart.getTime() >= minTime.getTime();
};

export default function AppointmentBooking({
  professional,
  token,
  onSuccess,
  onCancel,
}: AppointmentBookingProps) {
  // Ref para prevenir múltiplos cliques simultâneos
  const isSubmittingRef = useRef(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => getInitialSelectedDate());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });
  const isMountedRef = useRef(true);
  const { showToast } = useToast();

  const bookingBackRef = useRef(onCancel);
  bookingBackRef.current = onCancel;
  useHardwareBackPress(() => {
    bookingBackRef.current();
    return true;
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDate || !selectedTime) return;
    if (!isTimeSlotAllowed(selectedDate, selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedDate]);
  
  const availableDays = generateNextDays();
  const specialtyName = professional.specialties?.[0]?.specialty?.name || 'Especialista';
  const priceFormatted = professional.price ? Number(professional.price).toFixed(2) : '0.00';

  const handleConfirm = async () => {
    // Proteção contra múltiplos cliques usando ref
    if (loading || isSubmittingRef.current) {
      return;
    }

    // Marcar como submetendo imediatamente
    isSubmittingRef.current = true;

    if (!selectedDate || !selectedTime) {
      showToast('Por favor, selecione uma data e um horário', 'warning');
      isSubmittingRef.current = false;
      return;
    }

    // Data/hora no fuso local do aparelho → toISOString() envia o instante correto ao backend
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDateTime = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      hours,
      minutes,
      0,
      0,
    );
    
    const now = new Date();
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Mínimo 2 horas no futuro
    
    if (appointmentDateTime < minTime) {
      showToast('Por favor, selecione um horário com pelo menos 2 horas de antecedência', 'warning');
      isSubmittingRef.current = false;
      return;
    }

    // Validar professionalId
    if (!professional.id || typeof professional.id !== 'string') {
      showToast('ID do profissional inválido. Tente novamente.', 'error');
      isSubmittingRef.current = false;
      return;
    }

    // Validar token antes de fazer a requisição
    if (!token || !isTokenValid(token)) {
      setAlertModal({
        visible: true,
        title: 'Sessão Expirada',
        message: 'Sua sessão expirou. Por favor, faça login novamente.',
        type: 'warning',
        onConfirm: () => setAlertModal((prev) => ({ ...prev, visible: false })),
      });
      isSubmittingRef.current = false;
      return;
    }

    setLoading(true);

    try {
      // Validar professionalId é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const trimmedProfessionalId = professional.id.trim();
      
      if (!uuidRegex.test(trimmedProfessionalId)) {
        throw new Error('ID do profissional inválido. Formato UUID esperado.');
      }

      // Garantir que a data está em formato ISO 8601 válido
      const scheduledAtISO = appointmentDateTime.toISOString();
      
      if (!scheduledAtISO || isNaN(appointmentDateTime.getTime())) {
        throw new Error('Data/hora inválida');
      }

      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(scheduledAtISO)) {
        throw new Error('Formato de data inválido. Use formato ISO 8601.');
      }

      const appointmentData: CreateAppointmentDto = {
        professionalId: trimmedProfessionalId,
        scheduledAt: scheduledAtISO,
      };

      const appointment = await appointmentService.createAppointment(token, appointmentData);

      // Verificar se appointment é válido
      if (!appointment || !appointment.id) {
        if (isMountedRef.current) {
          showToast('Resposta inválida do servidor. Tente novamente.', 'error');
          setLoading(false);
          isSubmittingRef.current = false;
        }
        return;
      }
      
      // Garantir que selectedDate e selectedTime existem antes de usar
      if (!selectedDate || !selectedTime) {
        if (isMountedRef.current) {
          showToast('Erro interno. Tente novamente.', 'error');
          setLoading(false);
          isSubmittingRef.current = false;
        }
        return;
      }
      
      const savedDate = selectedDate;
      const savedTime = selectedTime;
      const savedProfessionalName = professional.fullName;
      
      if (isMountedRef.current) {
        setLoading(false);
        isSubmittingRef.current = false;
      }
      
      const initialDelay = Platform.OS === 'android' ? 200 : 100;
      
      setTimeout(() => {
        if (!isMountedRef.current) {
          return;
        }
        
        try {
          const message = `Consulta agendada com ${savedProfessionalName || 'o profissional'} para ${formatDate(savedDate)} às ${savedTime || 'horário selecionado'}`;
          const alertDelay = Platform.OS === 'android' ? 500 : 100;
          
          setTimeout(() => {
            if (!isMountedRef.current) {
              return;
            }
            
            try {
              setAlertModal({
                visible: true,
                title: 'Sucesso! ✅',
                message: message,
                type: 'success',
                onConfirm: () => {
                  setAlertModal((prev) => ({ ...prev, visible: false }));
                  const callbackDelay = Platform.OS === 'android' ? 300 : 200;
                  
                  setTimeout(() => {
                    if (isMountedRef.current && onSuccess) {
                      try {
                        onSuccess();
                      } catch (error) {
                        console.error('[APPOINTMENT] Erro ao chamar onSuccess:', error);
                      }
                    }
                  }, callbackDelay);
                },
              });
            } catch (alertError) {
              console.error('[APPOINTMENT] Erro ao exibir modal de sucesso:', alertError);
              setTimeout(() => {
                if (isMountedRef.current && onSuccess) {
                  try {
                    onSuccess();
                  } catch (error) {
                    console.error('[APPOINTMENT] Erro ao chamar onSuccess:', error);
                  }
                }
              }, 100);
            }
          }, alertDelay);
        } catch (error) {
          console.error('[APPOINTMENT] Erro ao preparar alert de sucesso:', error);
          setTimeout(() => {
            if (isMountedRef.current && onSuccess) {
              try {
                onSuccess();
              } catch (callbackError) {
                console.error('[APPOINTMENT] Erro ao chamar onSuccess:', callbackError);
              }
            }
          }, 100);
        }
      }, initialDelay);
    } catch (error: any) {
      console.error('[APPOINTMENT] Erro ao agendar consulta:', error?.message || error);
      
      if (!isMountedRef.current) {
        console.log('[APPOINTMENT] ⚠️ Componente desmontado, não exibindo alert de erro');
        isSubmittingRef.current = false;
        return;
      }
      
      // Tratar erro de rede
      if (!error.response) {
        if (isMountedRef.current) {
          showToast('Verifique sua conexão com a internet e tente novamente.', 'error');
          setLoading(false);
          isSubmittingRef.current = false;
        }
        return;
      }
      
      // Extrair mensagem (Nest: { statusCode, message: string | string[], path })
      let errorMessage = getApiErrorMessage(
        error,
        'Não foi possível agendar a consulta. Tente novamente.',
      );
      
      try {
        const statusCode = error.response?.status;
        
        if (statusCode === 400) {
          if (!errorMessage || errorMessage === 'Request failed with status code 400') {
            errorMessage = 'Dados inválidos. Verifique a data e o horário selecionados.';
          }
        } else if (statusCode === 401) {
          // Não mostrar alert para 401, o interceptor do axios já vai fazer logout
          // Apenas garantir que o loading seja resetado
          if (isMountedRef.current) {
            setLoading(false);
            isSubmittingRef.current = false;
          }
          return; // Sair sem mostrar alert, o logout automático vai tratar
        } else if (statusCode === 403) {
          const message = getApiErrorMessage(error, '');
          if (
            message.includes('Perfil de paciente não encontrado') ||
            message.includes('complete seu cadastro')
          ) {
            errorMessage =
              'Perfil de paciente não encontrado. Por favor, complete seu cadastro antes de agendar consultas.';
          } else {
            errorMessage = message || 'Você não tem permissão para realizar esta ação.';
          }
        } else if (statusCode === 404) {
          errorMessage = 'Profissional não encontrado.';
        } else if (statusCode >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        console.error('Erro ao parsear mensagem de erro:', parseError);
        errorMessage = 'Erro ao processar resposta do servidor.';
      }
      
      if (isMountedRef.current) {
        setLoading(false);
        isSubmittingRef.current = false;
        showToast(errorMessage, 'error');
      } else {
        // Se o componente foi desmontado, apenas resetar loading se possível
        try {
          setLoading(false);
          isSubmittingRef.current = false;
        } catch (stateError) {
          // Ignorar erro se componente foi desmontado
        }
      }
    }
  };

  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isTimeSelected = (time: string): boolean => {
    return selectedTime === time;
  };

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Azul Escuro */}
      <View style={styles.headerDark}>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backButtonIconDark}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitleDark}>Agendamento</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Card do Profissional */}
        <View style={[styles.professionalCard, { marginHorizontal: PAGE_PAD }]}>
          <View style={styles.professionalInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    professional.avatarUrl ||
                    `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                      professional.fullName
                    )}`,
                }}
                style={styles.avatar}
              />
            </View>
            
            <View style={styles.professionalDetails}>
              <Text style={styles.professionalSpecialty}>{specialtyName}</Text>
              <Text style={styles.professionalName}>{professional.fullName}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.rating}>
                  {professional.averageRating ? professional.averageRating.toFixed(1) : '0.0'} ({professional.reviewsCount || 0})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seção de Seleção de Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { paddingHorizontal: PAGE_PAD }]}>Selecione a Data</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesContainer}
          >
            {availableDays.map((date, index) => {
              const isSelected = isDateSelected(date);
              const isToday = index === 0;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardSelected,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dateWeekday,
                      isSelected && styles.dateWeekdaySelected,
                    ]}
                  >
                    {isToday ? 'Hoje' : formatDate(date).split(',')[0]}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      isSelected && styles.dateNumberSelected,
                    ]}
                  >
                    {formatDayNumber(date)}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      isSelected && styles.dateMonthSelected,
                    ]}
                  >
                    {isToday ? '' : formatMonth(date)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Seção de Seleção de Horário */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: PAGE_PAD }]}>Selecione o Horário</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => {
                const isSelected = isTimeSelected(time);
                const allowed = selectedDate ? isTimeSlotAllowed(selectedDate, time) : false;
                
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotSelected,
                      !allowed && styles.timeSlotDisabled,
                    ]}
                    disabled={!allowed}
                    onPress={() => {
                      if (!allowed) {
                        showToast(
                          'Escolha um horário com pelo menos 2 horas de antecedência.',
                          'warning',
                        );
                        return;
                      }
                      setSelectedTime(time);
                    }}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
                        !allowed && styles.timeSlotTextDisabled,
                      ]}
                    >
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

      </ScrollView>

      {/* Rodapé com Preço e Botão */}
      <View style={styles.footer}>
        <Text style={styles.footerPrice}>R$ {priceFormatted}</Text>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedDate || !selectedTime || loading) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!selectedDate || !selectedTime || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.light} />
          ) : (
            <Text style={styles.confirmButtonText}>CONFIRMAR</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Alerta */}
      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={() => {
          if (alertModal.onConfirm) {
            alertModal.onConfirm();
          } else {
            setAlertModal((prev) => ({ ...prev, visible: false }));
          }
        }}
        onCancel={() => setAlertModal((prev) => ({ ...prev, visible: false }))}
        showCancel={alertModal.showCancel}
      />
    </SafeAreaView>
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
    paddingBottom: 20,
  },
  
  // Header Escuro
  headerDark: {
    backgroundColor: colors.navigation.darkBlue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
  },
  backButtonIconDark: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitleDark: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },

  // Card do Profissional
  professionalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  professionalInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#90EE90',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  professionalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  professionalSpecialty: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  professionalName: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    fontSize: 16,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },

  // Seções
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
    marginBottom: 10,
  },

  // Seleção de Data — mesmo bloco visual das categorias rápidas (quickCat) da home
  datesContainer: {
    paddingHorizontal: PAGE_PAD,
    gap: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  dateCard: {
    width: 76,
    minHeight: 88,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dateCardSelected: {
    borderColor: NAVY,
    backgroundColor: '#F0F4FF',
  },
  dateWeekday: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
    textAlign: 'center',
  },
  dateWeekdaySelected: {
    color: NAVY,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: NAVY,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  dateMonthSelected: {
    color: NAVY,
  },

  // Seleção de Horário — mesmo estilo dos chips de filtro (chip / chipOn) da home
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 0,
    marginRight: 0,
    maxWidth: 220,
  },
  timeSlotSelected: {
    backgroundColor: '#E8EEF7',
    borderColor: NAVY,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  timeSlotTextSelected: {
    color: '#334155',
  },
  timeSlotDisabled: {
    opacity: 0.38,
    backgroundColor: '#F1F5F9',
    borderColor: '#E5EAF2',
  },
  timeSlotTextDisabled: {
    color: '#94a3b8',
  },

  // Resumo
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginTop: 8,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  summaryValuePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },

  // Footer (Preço e Botão)
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: PAGE_PAD,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.text.secondary,
    opacity: 0.5,
  },
  confirmButtonText: {
    color: colors.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});


