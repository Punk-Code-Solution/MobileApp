import React, { useState, useRef, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Professional, CreateAppointmentDto } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import { isTokenValid } from '../utils/token.util';

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

export default function AppointmentBooking({
  professional,
  token,
  onSuccess,
  onCancel,
}: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const availableDays = generateNextDays();
  const specialtyName = professional.specialties?.[0]?.specialty?.name || 'Especialista';
  const priceFormatted = professional.price ? Number(professional.price).toFixed(2) : '0.00';

  const handleConfirm = async () => {
    console.log('[APPOINTMENT] ===== INÍCIO DO PROCESSO DE AGENDAMENTO =====');
    console.log('[APPOINTMENT] Timestamp:', new Date().toISOString());
    console.log('[APPOINTMENT] Professional ID:', professional?.id);
    console.log('[APPOINTMENT] Professional Name:', professional?.fullName);
    console.log('[APPOINTMENT] Selected Date:', selectedDate?.toISOString());
    console.log('[APPOINTMENT] Selected Time:', selectedTime);
    console.log('[APPOINTMENT] Loading state:', loading);
    console.log('[APPOINTMENT] Component mounted:', isMountedRef.current);

    // Proteção contra múltiplos cliques
    if (loading) {
      console.log('[APPOINTMENT] ⚠️ Processo já em andamento, ignorando clique');
      return;
    }

    if (!selectedDate || !selectedTime) {
      console.log('[APPOINTMENT] ❌ Validação falhou: data ou horário não selecionados');
      try {
        Alert.alert('Atenção', 'Por favor, selecione uma data e um horário');
      } catch (error) {
        console.error('Erro ao exibir alert de validação:', error);
      }
      return;
    }

    // Validação: Não permitir agendamentos no passado
    console.log('[APPOINTMENT] 📅 Validando data e horário...');
    console.log('[APPOINTMENT] selectedDate (Date object):', selectedDate);
    console.log('[APPOINTMENT] selectedDate.toISOString():', selectedDate.toISOString());
    console.log('[APPOINTMENT] selectedDate.getTime():', selectedDate.getTime());
    console.log('[APPOINTMENT] selectedDate.getFullYear():', selectedDate.getFullYear());
    console.log('[APPOINTMENT] selectedDate.getMonth():', selectedDate.getMonth());
    console.log('[APPOINTMENT] selectedDate.getDate():', selectedDate.getDate());
    console.log('[APPOINTMENT] selectedTime:', selectedTime);
    
    // Criar nova data baseada na data selecionada, mas com o horário escolhido
    // IMPORTANTE: Usar getFullYear, getMonth, getDate para evitar problemas de timezone
    // Isso cria a data no timezone local, depois convertemos para UTC
    const [hours, minutes] = selectedTime.split(':').map(Number);
    console.log('[APPOINTMENT] Horas extraídas:', hours, 'Minutos:', minutes);
    
    const appointmentDateTime = new Date(
      Date.UTC(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hours,
        minutes,
        0,
        0
      )
    );
    
    console.log('[APPOINTMENT] appointmentDateTime criado (UTC):', appointmentDateTime);
    console.log('[APPOINTMENT] appointmentDateTime.toISOString():', appointmentDateTime.toISOString());
    console.log('[APPOINTMENT] appointmentDateTime.getTime():', appointmentDateTime.getTime());
    console.log('[APPOINTMENT] appointmentDateTime UTC components:', {
      year: appointmentDateTime.getUTCFullYear(),
      month: appointmentDateTime.getUTCMonth(),
      date: appointmentDateTime.getUTCDate(),
      hours: appointmentDateTime.getUTCHours(),
      minutes: appointmentDateTime.getUTCMinutes(),
    });
    
    const now = new Date();
    const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Mínimo 2 horas no futuro
    console.log('[APPOINTMENT] Data/hora atual (now):', now.toISOString());
    console.log('[APPOINTMENT] Data/hora mínima permitida:', minTime.toISOString());
    console.log('[APPOINTMENT] Diferença em horas:', (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log('[APPOINTMENT] appointmentDateTime < minTime?', appointmentDateTime < minTime);
    
    if (appointmentDateTime < minTime) {
      console.log('[APPOINTMENT] ❌ Validação falhou: horário muito próximo (mínimo 2h de antecedência)');
      try {
        Alert.alert(
          'Horário inválido',
          'Por favor, selecione um horário com pelo menos 2 horas de antecedência'
        );
      } catch (error) {
        console.error('Erro ao exibir alert de horário inválido:', error);
      }
      return;
    }

    // Validar professionalId
    console.log('[APPOINTMENT] 🔍 Validando professionalId...');
    if (!professional.id || typeof professional.id !== 'string') {
      console.log('[APPOINTMENT] ❌ Validação falhou: professionalId inválido');
      try {
        Alert.alert('Erro', 'ID do profissional inválido. Tente novamente.');
      } catch (error) {
        console.error('[APPOINTMENT] Erro ao exibir alert de ID inválido:', error);
      }
      return;
    }
    console.log('[APPOINTMENT] ✅ ProfessionalId válido:', professional.id);

    // Validar token antes de fazer a requisição
    console.log('[APPOINTMENT] 🔐 Validando token...');
    if (!token || !isTokenValid(token)) {
      console.log('[APPOINTMENT] ❌ Validação falhou: token inválido ou expirado');
      try {
        Alert.alert(
          'Sessão Expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        console.error('Erro ao exibir alert de token expirado:', error);
      }
      return;
    }

    console.log('[APPOINTMENT] ✅ Todas as validações passaram, iniciando requisição...');
    setLoading(true);

    try {
      console.log('[APPOINTMENT] 🔄 Preparando dados para envio...');
      
      // Validar professionalId é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const trimmedProfessionalId = professional.id.trim();
      console.log('[APPOINTMENT] Validando formato UUID do professionalId:', trimmedProfessionalId);
      
      if (!uuidRegex.test(trimmedProfessionalId)) {
        console.log('[APPOINTMENT] ❌ Formato UUID inválido');
        throw new Error('ID do profissional inválido. Formato UUID esperado.');
      }
      console.log('[APPOINTMENT] ✅ Formato UUID válido');

      // Garantir que a data está em formato ISO 8601 válido
      // Usar UTC para evitar problemas de timezone
      const scheduledAtISO = appointmentDateTime.toISOString();
      console.log('[APPOINTMENT] Data formatada para ISO 8601:', scheduledAtISO);
      
      // Validar formato antes de enviar
      if (!scheduledAtISO || isNaN(appointmentDateTime.getTime())) {
        console.log('[APPOINTMENT] ❌ Data/hora inválida após formatação');
        throw new Error('Data/hora inválida');
      }

      // Validar que a string ISO está no formato correto (deve terminar com Z ou ter timezone)
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(scheduledAtISO)) {
        console.log('[APPOINTMENT] ❌ Formato ISO 8601 inválido');
        throw new Error('Formato de data inválido. Use formato ISO 8601.');
      }
      console.log('[APPOINTMENT] ✅ Formato ISO 8601 válido');

      const appointmentData: CreateAppointmentDto = {
        professionalId: trimmedProfessionalId,
        scheduledAt: scheduledAtISO,
      };

      console.log('[APPOINTMENT] 📤 Dados preparados para envio:');
      console.log('[APPOINTMENT]   - professionalId:', appointmentData.professionalId);
      console.log('[APPOINTMENT]   - scheduledAt:', appointmentData.scheduledAt);
      console.log('[APPOINTMENT] 🚀 Chamando appointmentService.createAppointment...');

      let appointment;
      try {
        appointment = await appointmentService.createAppointment(token, appointmentData);
        console.log('[APPOINTMENT] ✅ Requisição bem-sucedida!');
        console.log('[APPOINTMENT] 📥 Resposta recebida:');
        console.log('[APPOINTMENT]   - Appointment ID:', appointment?.id);
        console.log('[APPOINTMENT]   - Scheduled At:', appointment?.scheduledAt);
      } catch (apiError: any) {
        console.log('[APPOINTMENT] ❌ Erro na requisição ao serviço');
        console.log('[APPOINTMENT] Tipo do erro:', typeof apiError);
        console.log('[APPOINTMENT] Mensagem do erro:', apiError?.message);
        console.log('[APPOINTMENT] Status code:', apiError?.response?.status);
        // Re-throw para ser tratado no catch externo
        throw apiError;
      }

      // Verificar se appointment é válido
      console.log('[APPOINTMENT] 🔍 Validando resposta do servidor...');
      if (!appointment || !appointment.id) {
        console.log('[APPOINTMENT] ❌ Resposta inválida do servidor');
        console.log('[APPOINTMENT] Appointment recebido:', appointment);
        if (isMountedRef.current) {
          Alert.alert('Erro', 'Resposta inválida do servidor. Tente novamente.');
          setLoading(false);
        }
        return;
      }
      console.log('[APPOINTMENT] ✅ Resposta do servidor válida');
      
      // Garantir que selectedDate e selectedTime existem antes de usar
      if (!selectedDate || !selectedTime) {
        console.error('Estado inválido: selectedDate ou selectedTime é null');
        if (isMountedRef.current) {
          Alert.alert('Erro', 'Erro interno. Tente novamente.');
          setLoading(false);
        }
        return;
      }
      
      // Salvar valores antes de resetar estado
      console.log('[APPOINTMENT] 💾 Salvando valores para exibição...');
      const savedDate = selectedDate;
      const savedTime = selectedTime;
      const savedProfessionalName = professional.fullName;
      
      console.log('[APPOINTMENT] 📝 Preparando mensagem de sucesso...');
      // Resetar loading antes de mostrar o alert
      if (isMountedRef.current) {
        setLoading(false);
        console.log('[APPOINTMENT] ✅ Loading resetado');
      }
      
      // Usar setTimeout para garantir que o estado seja atualizado (mais compatível com Android)
      const initialDelay = Platform.OS === 'android' ? 200 : 100;
      console.log('[APPOINTMENT] ⏱️ Aguardando', initialDelay, 'ms antes de exibir alert (Platform:', Platform.OS, ')');
      
      setTimeout(() => {
        if (!isMountedRef.current) {
          console.log('[APPOINTMENT] ⚠️ Componente desmontado, cancelando exibição do alert');
          return;
        }
        
        try {
          // Validar valores antes de usar no Alert
          const message = `Consulta agendada com ${savedProfessionalName || 'o profissional'} para ${formatDate(savedDate)} às ${savedTime || 'horário selecionado'}`;
          console.log('[APPOINTMENT] 📢 Mensagem de sucesso preparada:', message);
          
          // No Android, usar um delay maior antes de mostrar o Alert para evitar crashes
          const alertDelay = Platform.OS === 'android' ? 500 : 100;
          console.log('[APPOINTMENT] ⏱️ Aguardando', alertDelay, 'ms antes de exibir Alert...');
          
          setTimeout(() => {
            if (!isMountedRef.current) {
              console.log('[APPOINTMENT] ⚠️ Componente desmontado antes de exibir alert');
              return;
            }
            
            try {
              console.log('[APPOINTMENT] 🎉 Exibindo Alert de sucesso...');
              Alert.alert(
                'Sucesso! ✅',
                message,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      console.log('[APPOINTMENT] 👆 Botão OK pressionado no Alert');
                      // Usar um pequeno delay para garantir que o Alert foi completamente fechado
                      const callbackDelay = Platform.OS === 'android' ? 500 : 300;
                      console.log('[APPOINTMENT] ⏱️ Aguardando', callbackDelay, 'ms antes de chamar onSuccess...');
                      
                      setTimeout(() => {
                        if (isMountedRef.current && onSuccess) {
                          try {
                            console.log('[APPOINTMENT] 🔄 Chamando onSuccess callback...');
                            onSuccess();
                            console.log('[APPOINTMENT] ✅ onSuccess chamado com sucesso');
                            console.log('[APPOINTMENT] ===== PROCESSO DE AGENDAMENTO CONCLUÍDO COM SUCESSO =====');
                          } catch (error) {
                            console.error('[APPOINTMENT] ❌ Erro ao chamar onSuccess:', error);
                            // Tentar navegar de volta mesmo com erro
                            if (isMountedRef.current) {
                              try {
                                console.log('[APPOINTMENT] 🔄 Tentando chamar onSuccess novamente...');
                                onSuccess();
                              } catch (retryError) {
                                console.error('[APPOINTMENT] ❌ Erro ao tentar novamente onSuccess:', retryError);
                              }
                            }
                          }
                        } else {
                          console.log('[APPOINTMENT] ⚠️ Componente desmontado ou onSuccess não disponível');
                        }
                      }, callbackDelay);
                    },
                  },
                ],
                { cancelable: false }
              );
              console.log('[APPOINTMENT] ✅ Alert de sucesso exibido');
            } catch (alertError) {
              console.error('[APPOINTMENT] ❌ Erro crítico ao exibir Alert de sucesso:', alertError);
              // Tentar chamar onSuccess mesmo sem mostrar o alert
              setTimeout(() => {
                if (isMountedRef.current && onSuccess) {
                  try {
                    console.log('[APPOINTMENT] 🔄 Chamando onSuccess após erro no Alert...');
                    onSuccess();
                  } catch (error) {
                    console.error('[APPOINTMENT] ❌ Erro ao chamar onSuccess após erro no Alert:', error);
                  }
                }
              }, 100);
            }
          }, alertDelay);
        } catch (error) {
          console.error('[APPOINTMENT] ❌ Erro ao preparar Alert de sucesso:', error);
          // Tentar chamar onSuccess mesmo com erro
          setTimeout(() => {
            if (isMountedRef.current && onSuccess) {
              try {
                console.log('[APPOINTMENT] 🔄 Chamando onSuccess após erro na preparação...');
                onSuccess();
              } catch (callbackError) {
                console.error('[APPOINTMENT] ❌ Erro ao chamar onSuccess após erro:', callbackError);
              }
            }
          }, 100);
        }
      }, initialDelay);
    } catch (error: any) {
      console.log('[APPOINTMENT] ❌ ===== ERRO NO PROCESSO DE AGENDAMENTO =====');
      console.log('[APPOINTMENT] Timestamp do erro:', new Date().toISOString());
      
      // Logs protegidos contra erros de serialização
      try {
        console.error('[APPOINTMENT] Erro capturado:', error);
        console.log('[APPOINTMENT] Tipo do erro:', typeof error);
        console.log('[APPOINTMENT] Nome do erro:', error?.name);
        console.log('[APPOINTMENT] Mensagem do erro:', error?.message);
        console.log('[APPOINTMENT] Stack trace:', error?.stack);
        
        if (error && typeof error === 'object') {
          try {
            console.log('[APPOINTMENT] Erro completo (JSON):', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
          } catch (stringifyError) {
            console.error('[APPOINTMENT] Erro ao serializar erro completo:', stringifyError);
          }
        }
        
        if (error?.response) {
          console.log('[APPOINTMENT] Status code:', error.response.status);
          console.log('[APPOINTMENT] Status text:', error.response.statusText);
          try {
            const errorData = error.response.data;
            console.log('[APPOINTMENT] ===== RESPONSE DATA COMPLETO =====');
            
            // Forçar exibição completa
            try {
              const errorDataString = JSON.stringify(errorData, null, 2);
              console.log('[APPOINTMENT]', errorDataString);
              // Logar linha por linha para garantir
              errorDataString.split('\n').forEach((line: string) => {
                console.log('[APPOINTMENT]', line);
              });
            } catch (stringifyError) {
              console.log('[APPOINTMENT] Erro ao stringify, mostrando propriedades:');
              if (errorData && typeof errorData === 'object') {
                Object.keys(errorData).forEach((key) => {
                  try {
                    console.log(`[APPOINTMENT] ${key}:`, JSON.stringify(errorData[key], null, 2));
                  } catch (e) {
                    console.log(`[APPOINTMENT] ${key}:`, errorData[key]);
                  }
                });
              }
            }
            console.log('[APPOINTMENT] ===== FIM RESPONSE DATA =====');
            
            // Extrair mensagem de erro de diferentes formatos
            let errorMessage = 'Erro desconhecido';
            
            if (errorData?.message) {
              if (typeof errorData.message === 'string') {
                errorMessage = errorData.message;
              } else if (Array.isArray(errorData.message)) {
                errorMessage = errorData.message.join(', ');
              } else {
                errorMessage = JSON.stringify(errorData.message);
              }
            } else if (errorData?.data?.message) {
              errorMessage = typeof errorData.data.message === 'string'
                ? errorData.data.message
                : JSON.stringify(errorData.data.message);
            } else if (errorData?.error) {
              errorMessage = errorData.error;
            } else if (typeof errorData === 'string') {
              errorMessage = errorData;
            }
            
            console.log('[APPOINTMENT] ===== MENSAGEM DE ERRO EXTRAÍDA =====');
            console.log('[APPOINTMENT] Mensagem:', errorMessage);
            console.log('[APPOINTMENT] Tipo da mensagem:', typeof errorMessage);
            
            // Se houver validações, mostrar detalhes
            if (errorData?.message && Array.isArray(errorData.message)) {
              console.log('[APPOINTMENT] ===== ERROS DE VALIDAÇÃO DETALHADOS =====');
              errorData.message.forEach((err: any, index: number) => {
                console.log(`[APPOINTMENT] Erro ${index + 1}:`, JSON.stringify(err, null, 2));
                if (err?.constraints) {
                  console.log(`[APPOINTMENT]   Constraints:`, JSON.stringify(err.constraints, null, 2));
                }
                if (err?.property) {
                  console.log(`[APPOINTMENT]   Property:`, err.property);
                }
              });
            }
            
            console.log('[APPOINTMENT] Response headers:', JSON.stringify(error.response.headers, null, 2));
          } catch (dataError) {
            console.error('[APPOINTMENT] Erro ao logar response data:', dataError);
          }
        } else if (error?.request) {
          console.log('[APPOINTMENT] Erro de rede - requisição enviada mas sem resposta');
          console.log('[APPOINTMENT] Request URL:', error.config?.url);
          console.log('[APPOINTMENT] Request method:', error.config?.method);
          console.log('[APPOINTMENT] Request data:', JSON.stringify(error.config?.data, null, 2));
        } else {
          console.log('[APPOINTMENT] Erro antes de enviar requisição');
        }
      } catch (logError) {
        console.error('[APPOINTMENT] Erro crítico ao logar erro:', logError);
      }
      
      if (!isMountedRef.current) {
        console.log('[APPOINTMENT] ⚠️ Componente desmontado, não exibindo alert de erro');
        return;
      }
      
      // Tratar erro de rede
      if (!error.response) {
        if (isMountedRef.current) {
          Alert.alert(
            'Sem Conexão',
            'Verifique sua conexão com a internet e tente novamente.'
          );
          setLoading(false);
        }
        return;
      }
      
      // Extrair mensagem de erro de forma mais robusta
      let errorMessage = 'Não foi possível agendar a consulta. Tente novamente.';
      
      try {
        const statusCode = error.response?.status;
        
        // Tratar diferentes tipos de erro
        if (statusCode === 400) {
          // Bad Request - erro de validação
          const errorData = error.response.data;
          
          // Tentar extrair mensagem de diferentes formatos
          if (errorData?.data?.message) {
            errorMessage = errorData.data.message;
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          } else if (errorData?.data?.error) {
            errorMessage = errorData.data.error;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          } else if (Array.isArray(errorData?.message)) {
            // Se for array de mensagens de validação
            errorMessage = errorData.message.join(', ');
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else {
            errorMessage = 'Dados inválidos. Verifique a data e horário selecionados.';
          }
        } else if (statusCode === 401) {
          // Não mostrar alert para 401, o interceptor do axios já vai fazer logout
          // Apenas garantir que o loading seja resetado
          if (isMountedRef.current) {
            setLoading(false);
          }
          return; // Sair sem mostrar alert, o logout automático vai tratar
        } else if (statusCode === 403) {
          errorMessage = 'Você não tem permissão para realizar esta ação.';
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
        // No Android, usar um pequeno delay antes de mostrar o Alert para evitar crashes
        const alertDelay = Platform.OS === 'android' ? 300 : 0;
        
        setTimeout(() => {
          if (!isMountedRef.current) return;
          
          try {
            Alert.alert('Erro ao Agendar', errorMessage);
          } catch (alertError) {
            console.error('Erro crítico ao exibir alert:', alertError);
          }
          try {
            setLoading(false);
          } catch (stateError) {
            console.error('Erro ao atualizar estado loading:', stateError);
          }
        }, alertDelay);
      } else {
        // Se o componente foi desmontado, apenas resetar loading se possível
        try {
          setLoading(false);
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
                <Text style={styles.rating}>
                  {professional.averageRating ? professional.averageRating.toFixed(1) : '0.0'} ({professional.reviewsCount || 0})
                </Text>
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


