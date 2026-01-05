import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Professional, CreateAppointmentDto } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';

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
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00',
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

export default function AppointmentBooking({
  professional,
  token,
  onSuccess,
  onCancel,
}: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const availableDays = generateNextDays();
  const specialtyName = professional.specialties?.[0]?.specialty?.name || 'Especialista';
  const priceFormatted = professional.price ? Number(professional.price).toFixed(2) : '0.00';

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Atenção', 'Por favor, selecione uma data e um horário');
      return;
    }

    // Validação: Não permitir agendamentos no passado
    const appointmentDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    appointmentDateTime.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Mínimo 2 horas no futuro
    
    if (appointmentDateTime < minTime) {
      Alert.alert(
        'Horário inválido',
        'Por favor, selecione um horário com pelo menos 2 horas de antecedência'
      );
      return;
    }

    setLoading(true);

    try {
      const appointmentData: CreateAppointmentDto = {
        professionalId: professional.id,
        scheduledAt: appointmentDateTime.toISOString(),
      };

      console.log('Enviando dados do agendamento:', JSON.stringify(appointmentData, null, 2));

      const appointment = await appointmentService.createAppointment(token, appointmentData);

      console.log('Agendamento criado:', JSON.stringify(appointment, null, 2));
      
      // Verificar se appointment é válido
      if (!appointment || !appointment.id) {
        console.error('Resposta inválida do servidor:', appointment);
        Alert.alert('Erro', 'Resposta inválida do servidor. Tente novamente.');
        setLoading(false);
        return;
      }
      
      // Garantir que selectedDate e selectedTime existem antes de usar
      if (!selectedDate || !selectedTime) {
        console.error('Estado inválido: selectedDate ou selectedTime é null');
        Alert.alert('Erro', 'Erro interno. Tente novamente.');
        setLoading(false);
        return;
      }
      
      Alert.alert(
        'Sucesso! ✅',
        `Consulta agendada com ${professional.fullName} para ${formatDate(selectedDate)} às ${selectedTime}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setLoading(false);
              onSuccess();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao agendar:', error);
      console.error('Erro completo:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      // Tratar erro de rede
      if (!error.response) {
        Alert.alert(
          'Sem Conexão',
          'Verifique sua conexão com a internet e tente novamente.'
        );
        setLoading(false);
        return;
      }
      
      // Extrair mensagem de erro
      let errorMessage = 'Não foi possível agendar a consulta. Tente novamente.';
      
      try {
        if (error.response?.data) {
          // O TransformInterceptor envolve erros também
          const errorData = error.response.data.data || error.response.data;
          if (typeof errorData === 'object' && errorData !== null) {
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        console.error('Erro ao parsear mensagem de erro:', parseError);
      }
      
      Alert.alert('Erro', errorMessage);
      setLoading(false);
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
    <SafeAreaView style={styles.container}>
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
        <View style={styles.professionalCard}>
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
                <Text style={styles.rating}>4.5 (261)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seção de Seleção de Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecione a Data</Text>
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
            <Text style={styles.sectionTitle}>Selecione o Horário</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => {
                const isSelected = isTimeSelected(time);
                
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeSlot,
                      isSelected && styles.timeSlotSelected,
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        isSelected && styles.timeSlotTextSelected,
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
    marginHorizontal: 24,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
    paddingHorizontal: 24,
  },

  // Seleção de Data
  datesContainer: {
    paddingHorizontal: 24,
    paddingRight: 24,
  },
  dateCard: {
    width: 75,
    height: 95,
    backgroundColor: colors.surface,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  dateCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dateWeekday: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  dateWeekdaySelected: {
    color: colors.text.light,
  },
  dateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  dateNumberSelected: {
    color: colors.text.light,
  },
  dateMonth: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  dateMonthSelected: {
    color: colors.text.light,
  },

  // Seleção de Horário
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  timeSlot: {
    minWidth: 95,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: colors.surface,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  timeSlotSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  timeSlotTextSelected: {
    color: colors.text.light,
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
    paddingHorizontal: 24,
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


