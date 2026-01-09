/**
 * Serviço de agendamentos
 * Centraliza todas as chamadas de API relacionadas a agendamentos
 */

import { api } from '../../config/axios.config';
import { API_ENDPOINTS } from '../../config/api.config';
import { Appointment, CreateAppointmentDto } from '../../types/appointment.types';
import { getCache, setCache, removeCache, CACHE_KEYS } from '../../utils/cache';
import { isTokenValid } from '../../utils/token.util';

export const appointmentService = {
  /**
   * Busca todos os agendamentos do usuário autenticado
   * Usa cache para melhorar performance
   */
  async getMyAppointments(token: string, useCache: boolean = true): Promise<Appointment[]> {
    // Tentar buscar do cache primeiro
    if (useCache) {
      const cached = await getCache<Appointment[]>(CACHE_KEYS.APPOINTMENTS);
      if (cached) {
        return cached;
      }
    }

    const response = await api.get<{ data: Appointment[]; statusCode: number }>(API_ENDPOINTS.APPOINTMENTS.ME, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    const appointments = response.data.data || response.data;
    const appointmentsArray = Array.isArray(appointments) ? appointments : [];

    // Salvar no cache (TTL de 2 minutos para appointments)
    if (useCache) {
      await setCache(CACHE_KEYS.APPOINTMENTS, appointmentsArray, { ttl: 2 * 60 * 1000 });
    }

    return appointmentsArray;
  },

  /**
   * Cria um novo agendamento
   */
  async createAppointment(token: string, data: CreateAppointmentDto): Promise<Appointment> {
    console.log('[APPOINTMENT-SERVICE] ===== INÍCIO createAppointment =====');
    console.log('[APPOINTMENT-SERVICE] Timestamp:', new Date().toISOString());
    console.log('[APPOINTMENT-SERVICE] Token presente:', !!token);
    console.log('[APPOINTMENT-SERVICE] Token length:', token?.length);
    console.log('[APPOINTMENT-SERVICE] Data recebida:', {
      professionalId: data?.professionalId,
      scheduledAt: data?.scheduledAt,
    });
    
    try {
      // Validar dados antes de enviar
      console.log('[APPOINTMENT-SERVICE] 🔍 Validando dados de entrada...');
      if (!data || !data.professionalId || !data.scheduledAt) {
        console.log('[APPOINTMENT-SERVICE] ❌ Dados de agendamento inválidos');
        throw new Error('Dados de agendamento inválidos');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Dados básicos válidos');

      // Validar formato UUID do professionalId
      console.log('[APPOINTMENT-SERVICE] 🔍 Validando formato UUID...');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const trimmedProfessionalId = data.professionalId.trim();
      if (!uuidRegex.test(trimmedProfessionalId)) {
        console.log('[APPOINTMENT-SERVICE] ❌ Formato UUID inválido:', trimmedProfessionalId);
        throw new Error('ID do profissional inválido. Formato UUID esperado.');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Formato UUID válido');

      // Validar formato ISO 8601 da data
      console.log('[APPOINTMENT-SERVICE] 🔍 Validando formato ISO 8601...');
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(data.scheduledAt)) {
        console.log('[APPOINTMENT-SERVICE] ❌ Formato ISO 8601 inválido:', data.scheduledAt);
        throw new Error('Formato de data inválido. Use formato ISO 8601 (ex: 2024-01-15T14:30:00Z)');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Formato ISO 8601 válido');

      // Validar token
      console.log('[APPOINTMENT-SERVICE] 🔍 Validando token...');
      if (!token || typeof token !== 'string') {
        console.log('[APPOINTMENT-SERVICE] ❌ Token inválido');
        throw new Error('Token de autenticação inválido');
      }

      // Validar se token não está expirado
      console.log('[APPOINTMENT-SERVICE] 🔍 Verificando expiração do token...');
      if (!isTokenValid(token)) {
        console.log('[APPOINTMENT-SERVICE] ❌ Token expirado');
        throw new Error('Token expirado. Por favor, faça login novamente.');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Token válido e não expirado');

      const requestPayload = {
        professionalId: trimmedProfessionalId,
        scheduledAt: data.scheduledAt,
      };
      
      console.log('[APPOINTMENT-SERVICE] 📤 Enviando requisição POST para:', API_ENDPOINTS.APPOINTMENTS.BASE);
      console.log('[APPOINTMENT-SERVICE] Payload:', JSON.stringify(requestPayload, null, 2));
      console.log('[APPOINTMENT-SERVICE] Headers:', {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json',
      });
      
      const requestStartTime = Date.now();
      const response = await api.post<{ data: Appointment; statusCode: number }>(
        API_ENDPOINTS.APPOINTMENTS.BASE, 
        requestPayload, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 segundos de timeout
        }
      );
      
      const requestDuration = Date.now() - requestStartTime;
      console.log('[APPOINTMENT-SERVICE] ✅ Resposta recebida em', requestDuration, 'ms');
      console.log('[APPOINTMENT-SERVICE] Status code:', response.status);
      console.log('[APPOINTMENT-SERVICE] Response data keys:', Object.keys(response.data || {}));
      
      // Verificar se response existe
      console.log('[APPOINTMENT-SERVICE] 🔍 Validando resposta do servidor...');
      if (!response || !response.data) {
        console.log('[APPOINTMENT-SERVICE] ❌ Resposta vazia do servidor');
        throw new Error('Resposta vazia do servidor');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Resposta não vazia');
      
      // O TransformInterceptor envolve a resposta em { data, statusCode }
      const appointment = response.data.data || response.data;
      console.log('[APPOINTMENT-SERVICE] Appointment extraído:', {
        hasId: !!appointment?.id,
        id: appointment?.id,
        scheduledAt: appointment?.scheduledAt,
      });
      
      // Garantir que temos um objeto válido
      if (!appointment || typeof appointment !== 'object') {
        console.log('[APPOINTMENT-SERVICE] ❌ Resposta inválida do servidor');
        console.log('[APPOINTMENT-SERVICE] Tipo recebido:', typeof appointment);
        throw new Error('Resposta inválida do servidor');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Objeto válido');
      
      // Validar que appointment tem id
      if (!appointment.id || typeof appointment.id !== 'string') {
        console.log('[APPOINTMENT-SERVICE] ❌ Agendamento sem ID válido');
        throw new Error('Agendamento criado sem ID válido');
      }
      console.log('[APPOINTMENT-SERVICE] ✅ Agendamento com ID válido:', appointment.id);
      
      // Normalizar datas se necessário (sem modificar se já estiver correto)
      if (appointment.scheduledAt && typeof appointment.scheduledAt === 'string') {
        // Apenas validar, não modificar
        const date = new Date(appointment.scheduledAt);
        if (isNaN(date.getTime())) {
          console.warn('Data scheduledAt inválida na resposta:', appointment.scheduledAt);
        }
      }
      if (appointment.createdAt && typeof appointment.createdAt === 'string') {
        // Apenas validar, não modificar
        const date = new Date(appointment.createdAt);
        if (isNaN(date.getTime())) {
          console.warn('Data createdAt inválida na resposta:', appointment.createdAt);
        }
      }
      
      // Invalidar cache de appointments após criar novo (com proteção)
      console.log('[APPOINTMENT-SERVICE] 🗑️ Invalidando cache...');
      try {
        await removeCache(CACHE_KEYS.APPOINTMENTS);
        console.log('[APPOINTMENT-SERVICE] ✅ Cache invalidado');
      } catch (cacheError) {
        console.warn('[APPOINTMENT-SERVICE] ⚠️ Erro ao invalidar cache (não crítico):', cacheError);
        // Não propagar erro de cache
      }

      console.log('[APPOINTMENT-SERVICE] ✅ ===== createAppointment CONCLUÍDO COM SUCESSO =====');
      console.log('[APPOINTMENT-SERVICE] Retornando appointment:', {
        id: appointment.id,
        scheduledAt: appointment.scheduledAt,
      });
      
      return appointment as Appointment;
    } catch (error: any) {
      console.log('[APPOINTMENT-SERVICE] ❌ ===== ERRO em createAppointment =====');
      console.error('[APPOINTMENT-SERVICE] Erro capturado:', error);
      console.log('[APPOINTMENT-SERVICE] Tipo do erro:', typeof error);
      console.log('[APPOINTMENT-SERVICE] Mensagem:', error?.message);
      
      // Proteger contra erros de serialização
      try {
        if (error?.response) {
          console.log('[APPOINTMENT-SERVICE] Status code:', error.response.status);
          
          // Forçar exibição completa do response data
          const errorData = error.response.data;
          console.log('[APPOINTMENT-SERVICE] ===== RESPONSE DATA COMPLETO =====');
          
          // Logar cada propriedade separadamente para garantir que aparece
          if (errorData && typeof errorData === 'object') {
            console.log('[APPOINTMENT-SERVICE] Tipo do errorData:', typeof errorData);
            const keys = Object.keys(errorData);
            console.log('[APPOINTMENT-SERVICE] Numero de keys:', keys.length);
            console.log('[APPOINTMENT-SERVICE] Keys do errorData:', keys.join(', '));
            
            // Logar statusCode primeiro
            if ('statusCode' in errorData) {
              console.log('[APPOINTMENT-SERVICE] STATUS_CODE:', errorData.statusCode);
            }
            
            // Logar message (mais importante)
            if ('message' in errorData) {
              const msg = errorData.message;
              console.log('[APPOINTMENT-SERVICE] MESSAGE_TYPE:', typeof msg);
              if (typeof msg === 'string') {
                console.log('[APPOINTMENT-SERVICE] MESSAGE_STRING:', msg);
              } else if (Array.isArray(msg)) {
                console.log('[APPOINTMENT-SERVICE] MESSAGE_ARRAY_LENGTH:', msg.length);
                msg.forEach((item: any, index: number) => {
                  console.log(`[APPOINTMENT-SERVICE] MESSAGE[${index}]:`, typeof item === 'string' ? item : JSON.stringify(item));
                  if (item && typeof item === 'object' && item.constraints) {
                    console.log(`[APPOINTMENT-SERVICE] MESSAGE[${index}].constraints:`, JSON.stringify(item.constraints));
                  }
                  if (item && typeof item === 'object' && item.property) {
                    console.log(`[APPOINTMENT-SERVICE] MESSAGE[${index}].property:`, item.property);
                  }
                });
              } else {
                console.log('[APPOINTMENT-SERVICE] MESSAGE_OBJECT:', JSON.stringify(msg));
              }
            }
            
            // Logar outras propriedades
            keys.forEach((key) => {
              if (key === 'statusCode' || key === 'message') return; // Já logamos acima
              const value = errorData[key];
              try {
                if (typeof value === 'string') {
                  console.log(`[APPOINTMENT-SERVICE] ${key.toUpperCase()}:`, value);
                } else {
                  console.log(`[APPOINTMENT-SERVICE] ${key.toUpperCase()}:`, JSON.stringify(value));
                }
              } catch (e) {
                console.log(`[APPOINTMENT-SERVICE] ${key.toUpperCase()}:`, String(value));
              }
            });
          } else {
            console.log('[APPOINTMENT-SERVICE] errorData (não é objeto):', String(errorData));
          }
          
          // Tentar stringify completo também
          try {
            const errorDataString = JSON.stringify(errorData, null, 2);
            console.log('[APPOINTMENT-SERVICE] ===== JSON COMPLETO =====');
            // Dividir em chunks menores para garantir que aparece
            const lines = errorDataString.split('\n');
            lines.forEach((line) => {
              console.log('[APPOINTMENT-SERVICE]', line);
            });
            console.log('[APPOINTMENT-SERVICE] ===== FIM JSON COMPLETO =====');
          } catch (stringifyError) {
            console.log('[APPOINTMENT-SERVICE] Erro ao fazer stringify completo:', String(stringifyError));
          }
          
          console.log('[APPOINTMENT-SERVICE] ===== FIM RESPONSE DATA =====');
          
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
          
          console.log('[APPOINTMENT-SERVICE] ===== MENSAGEM DE ERRO EXTRAÍDA =====');
          console.log('[APPOINTMENT-SERVICE] Mensagem:', errorMessage);
          console.log('[APPOINTMENT-SERVICE] Tipo da mensagem:', typeof errorMessage);
          
          // Se houver validações, mostrar detalhes
          if (errorData?.message && Array.isArray(errorData.message)) {
            console.log('[APPOINTMENT-SERVICE] ===== ERROS DE VALIDAÇÃO DETALHADOS =====');
            errorData.message.forEach((err: any, index: number) => {
              console.log(`[APPOINTMENT-SERVICE] Erro ${index + 1}:`, JSON.stringify(err, null, 2));
              if (err?.constraints) {
                console.log(`[APPOINTMENT-SERVICE]   Constraints:`, JSON.stringify(err.constraints, null, 2));
              }
              if (err?.property) {
                console.log(`[APPOINTMENT-SERVICE]   Property:`, err.property);
              }
            });
          }
          
          console.log('[APPOINTMENT-SERVICE] Response headers:', JSON.stringify(error.response.headers, null, 2));
        } else if (error?.request) {
          console.log('[APPOINTMENT-SERVICE] Erro de rede - requisição enviada mas sem resposta');
          console.log('[APPOINTMENT-SERVICE] Request config:', JSON.stringify(error.config, null, 2));
        } else {
          console.log('[APPOINTMENT-SERVICE] Erro antes de enviar requisição');
        }
      } catch (logError) {
        console.error('[APPOINTMENT-SERVICE] Erro ao logar detalhes do erro:', logError);
      }
      
      // Re-throw o erro para ser tratado no componente
      throw error;
    }
  },

  /**
   * Cancela um agendamento
   */
  async cancelAppointment(token: string, appointmentId: string): Promise<void> {
    await api.patch(
      API_ENDPOINTS.APPOINTMENTS.CANCEL(appointmentId),
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Invalidar cache após cancelar
    await removeCache(CACHE_KEYS.APPOINTMENTS);
  },

  /**
   * Avalia um agendamento
   */
  async rateAppointment(
    token: string,
    appointmentId: string,
    data: { rating: number; comment?: string }
  ): Promise<any> {
    const response = await api.post<{ data: any; statusCode: number }>(
      API_ENDPOINTS.APPOINTMENTS.RATE(appointmentId),
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Invalidar cache após avaliar
    await removeCache(CACHE_KEYS.APPOINTMENTS);
    // O TransformInterceptor envolve a resposta em { data, statusCode }
    // Usar fallback para garantir compatibilidade
    return response.data.data || response.data;
  },
};

