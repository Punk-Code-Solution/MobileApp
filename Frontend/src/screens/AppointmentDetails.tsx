/**
 * Agenda do dia — paciente (layout inspirado no mockup Servix).
 * Margens alinhadas à SelectTypeScreen (PAGE_PAD = 22).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import AppointmentDetailsModal from './AppointmentDetailsModal';
import MedicalHistoryScreen from './MedicalHistoryScreen';
import RateAppointmentScreen from './RateAppointmentScreen';

const PAGE_PAD = 22;
const NAVY = '#1A4A8E';
const LOCATION_KEY = '@telemedicina:patientLocationLabel';

const WEEK_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
const MONTH_SHORT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export type FilterStatus = 'all' | 'SCHEDULED' | 'PENDING_PAYMENT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED';
export type FilterModality = 'all' | 'online' | 'presential';

interface AppointmentDetailsProps {
  token: string;
  /** Quando não vier de stack com seta voltar */
  onBack?: () => void;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
  onNavigateToChat?: (
    conversationIdOrProfessionalId: string,
    professionalName: string,
    professionalAvatar?: string,
  ) => void;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function statusPatientLabel(status: Appointment['status']): { text: string; ok: boolean } {
  switch (status) {
    case 'SCHEDULED':
    case 'PENDING_PAYMENT':
      return { text: 'Confirmado', ok: true };
    case 'IN_PROGRESS':
      return { text: 'Em andamento', ok: true };
    case 'COMPLETED':
      return { text: 'Concluído', ok: true };
    case 'CANCELED':
      return { text: 'Cancelado', ok: false };
    default:
      return { text: String(status), ok: false };
  }
}

function isOnlineAppointment(a: Appointment): boolean {
  return !!a.videoRoomUrl;
}

export default function AppointmentDetails({
  token,
  onBack,
  onShowNotifications,
  unreadNotificationsCount = 0,
  onNavigateToChat,
}: AppointmentDetailsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [locationLabel, setLocationLabel] = useState('Ilhéus - BA');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterModality, setFilterModality] = useState<FilterModality>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [ratingAppointment, setRatingAppointment] = useState<Appointment | null>(null);
  const [screenState, setScreenState] = useState<'agenda' | 'history'>('agenda');

  const dateStrip = useMemo(() => {
    const today = startOfDay(new Date());
    const start = addDays(today, -7);
    return Array.from({ length: 21 }, (_, i) => addDays(start, i));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem(LOCATION_KEY);
        if (s) {
          setLocationLabel(s);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const fetchAppointments = useCallback(async () => {
    try {
      const data = await appointmentService.getMyAppointments(token, false);
      setAppointments(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error(e);
      setAppointments([]);
      if (!e?.response) {
        Alert.alert('Sem conexão', 'Verifique sua internet.');
      }
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

  const dayAppointments = useMemo(() => {
    let list = (Array.isArray(appointments) ? appointments : []).filter(
      (a) => a && a.id && (a.patientId || a.professionalId),
    );

    list = list.filter((a) => isSameDay(new Date(a.scheduledAt), selectedDay));

    if (filterStatus !== 'all') {
      list = list.filter((a) => a.status === filterStatus);
    }

    if (filterModality === 'online') {
      list = list.filter((a) => isOnlineAppointment(a));
    } else if (filterModality === 'presential') {
      list = list.filter((a) => !isOnlineAppointment(a));
    }

    return list.sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
  }, [appointments, selectedDay, filterStatus, filterModality]);

  const openLocation = () => {
    setTempLocation(locationLabel);
    setShowLocationModal(true);
  };

  const saveLocation = async () => {
    const t = tempLocation.trim() || 'Ilhéus - BA';
    setLocationLabel(t);
    try {
      await AsyncStorage.setItem(LOCATION_KEY, t);
    } catch {
      /* ignore */
    }
    setShowLocationModal(false);
  };

  const applyFilters = (status: FilterStatus, mod: FilterModality) => {
    setFilterStatus(status);
    setFilterModality(mod);
    setShowFilterModal(false);
  };

  const openVideo = (a: Appointment) => {
    if (a.videoRoomUrl) {
      Linking.openURL(a.videoRoomUrl).catch(() =>
        Alert.alert('Erro', 'Não foi possível abrir o link.'),
      );
    }
  };

  const openChat = (a: Appointment) => {
    const prof = a.professional;
    if (!prof?.id || !onNavigateToChat) {
      Alert.alert('Indisponível', 'Não foi possível abrir o chat.');
      return;
    }
    onNavigateToChat(prof.id, prof.fullName || 'Profissional', prof.avatarUrl);
  };

  if (ratingAppointment) {
    return (
      <RateAppointmentScreen
        appointment={ratingAppointment}
        token={token}
        onBack={() => setRatingAppointment(null)}
        onSuccess={() => {
          setRatingAppointment(null);
          fetchAppointments();
        }}
      />
    );
  }

  if (screenState === 'history') {
    return (
      <MedicalHistoryScreen
        token={token}
        onBack={() => setScreenState('agenda')}
        onNavigateToChat={onNavigateToChat}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, { justifyContent: 'center' }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color={NAVY} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[NAVY]} tintColor={NAVY} />
        }
        contentContainerStyle={styles.scrollPad}
      >
        {/* Cabeçalho */}
        <View style={[styles.headerRow, { paddingHorizontal: PAGE_PAD }]}>
          <View style={styles.headerLeft}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.backHit}>
                <Text style={styles.backArrow}>←</Text>
              </TouchableOpacity>
            ) : null}
            <Text style={styles.brand}>Pronto</Text>
          </View>
          <TouchableOpacity style={styles.notifWrap} onPress={onShowNotifications} activeOpacity={0.7}>
            <Text style={styles.bell}>🔔</Text>
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Seletor de datas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {dateStrip.map((d, idx) => {
            const active = isSameDay(d, selectedDay);
            const w = WEEK_SHORT[d.getDay()];
            const dayNum = d.getDate();
            const mon = MONTH_SHORT[d.getMonth()];
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.dateChip, active && styles.dateChipOn]}
                onPress={() => setSelectedDay(startOfDay(d))}
                activeOpacity={0.85}
              >
                <Text style={[styles.dateChipWeek, active && styles.dateChipWeekOn]}>{w}</Text>
                <Text style={[styles.dateChipDay, active && styles.dateChipDayOn]}>
                  {dayNum} {mon}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Local + filtros */}
        <View style={[styles.locRow, { marginHorizontal: PAGE_PAD }]}>
          <View style={styles.locBar}>
            <Text style={styles.pin}>📍</Text>
            <Text style={styles.locTxt} numberOfLines={1}>
              {locationLabel}
            </Text>
            <TouchableOpacity onPress={openLocation} hitSlop={8}>
              <Text style={styles.link}>Alterar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filtBtn} onPress={() => setShowFilterModal(true)} activeOpacity={0.85}>
            <Text style={styles.filtBtnTxt}>Filtros</Text>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Chips de filtro rápido */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, { paddingHorizontal: PAGE_PAD }]}
        >
          <TouchableOpacity
            style={[styles.chip, filterStatus === 'SCHEDULED' && styles.chipOn]}
            onPress={() => setFilterStatus((s) => (s === 'SCHEDULED' ? 'all' : 'SCHEDULED'))}
          >
            <Text style={styles.chipTxt}>Só confirmadas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, filterModality === 'online' && styles.chipOn]}
            onPress={() =>
              setFilterModality((m) => (m === 'online' ? 'all' : 'online'))
            }
          >
            <Text style={styles.chipTxt}>Online</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, filterModality === 'presential' && styles.chipOn]}
            onPress={() =>
              setFilterModality((m) => (m === 'presential' ? 'all' : 'presential'))
            }
          >
            <Text style={styles.chipTxt}>Presencial</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={[styles.sectionTitle, { paddingHorizontal: PAGE_PAD }]}>Agenda do dia</Text>

        {dayAppointments.length === 0 ? (
          <View style={[styles.empty, { marginHorizontal: PAGE_PAD }]}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Nenhuma consulta neste dia</Text>
            <Text style={styles.emptySub}>Troque a data ou ajuste os filtros.</Text>
          </View>
        ) : (
          dayAppointments.map((item) => {
            const doc = item.professional?.fullName || 'Profissional';
            const spec =
              item.professional?.specialties?.[0]?.specialty?.name || 'Consulta';
            const st = statusPatientLabel(item.status);
            const online = isOnlineAppointment(item);
            const modalityLabel = online
              ? 'Atendimento online'
              : 'Atendimento presencial (1h)';

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { marginHorizontal: PAGE_PAD }]}
                onPress={() => setSelectedAppointment(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardInner}>
                  <Text style={styles.time}>{formatTime(item.scheduledAt)}</Text>
                  <View style={styles.cardMid}>
                    <Text style={styles.pName}>{doc}</Text>
                    <Text style={styles.pSub}>
                      {spec} · {modalityLabel}
                    </Text>
                    <View style={styles.statusRow}>
                      <Text style={styles.check}>{st.ok ? '✓' : '✕'}</Text>
                      <Text style={[styles.stLabel, !st.ok && styles.stOff]}>{st.text}</Text>
                    </View>
                  </View>
                  <View style={styles.cardActions}>
                    {online ? (
                      <TouchableOpacity onPress={() => openVideo(item)} hitSlop={8}>
                        <Text style={styles.actIcon}>📹</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Ligação', 'Telefone do profissional não disponível no app.')
                        }
                        hitSlop={8}
                      >
                        <Text style={styles.actIcon}>📞</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => openChat(item)} hitSlop={8}>
                      <Text style={styles.actIcon}>💬</Text>
                    </TouchableOpacity>
                    <Text style={styles.chevCard}>›</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={[styles.footerActions, { paddingHorizontal: PAGE_PAD }]}>
          <TouchableOpacity style={styles.footerLink} onPress={() => setScreenState('history')}>
            <Text style={styles.footerLinkTxt}>+ Ver histórico completo</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal detalhes (reutiliza o modal existente) */}
      {selectedAppointment && (
        <AppointmentDetailsModal
          appointment={selectedAppointment}
          token={token}
          userRole="PATIENT"
          onClose={() => setSelectedAppointment(null)}
          onCancelSuccess={() => {
            fetchAppointments();
            setSelectedAppointment(null);
          }}
          onRateAppointment={(apt) => {
            setRatingAppointment(apt);
            setTimeout(() => setSelectedAppointment(null), 50);
          }}
          onSendMessage={(conversationId, professionalId, professionalName, professionalAvatar) => {
            if (onNavigateToChat) {
              const idToUse = conversationId || professionalId;
              onNavigateToChat(idToUse, professionalName, professionalAvatar);
            }
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Modal filtros */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setShowFilterModal(false)}>
          <Pressable style={styles.modalBox}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <Text style={styles.modalHint}>Status</Text>
            <View style={styles.rowWrap}>
              {(
                [
                  ['all', 'Todos'],
                  ['SCHEDULED', 'Confirmada'],
                  ['PENDING_PAYMENT', 'Pagamento'],
                  ['IN_PROGRESS', 'Em andamento'],
                  ['COMPLETED', 'Concluída'],
                  ['CANCELED', 'Cancelada'],
                ] as const
              ).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.opt, filterStatus === val && styles.optOn]}
                  onPress={() => setFilterStatus(val)}
                >
                  <Text style={[styles.optTxt, filterStatus === val && styles.optTxtOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalHint}>Modalidade</Text>
            <View style={styles.rowWrap}>
              {(
                [
                  ['all', 'Todas'],
                  ['online', 'Online'],
                  ['presential', 'Presencial'],
                ] as const
              ).map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.opt, filterModality === val && styles.optOn]}
                  onPress={() => setFilterModality(val)}
                >
                  <Text style={[styles.optTxt, filterModality === val && styles.optTxtOn]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalPrimary}
              onPress={() => applyFilters(filterStatus, filterModality)}
            >
              <Text style={styles.modalPrimaryTxt}>Aplicar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalSecondary}
              onPress={() => {
                setFilterStatus('all');
                setFilterModality('all');
                setShowFilterModal(false);
              }}
            >
              <Text style={styles.modalSecondaryTxt}>Limpar filtros</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal local */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <Pressable style={styles.modalBg} onPress={() => setShowLocationModal(false)}>
          <Pressable style={styles.modalBox}>
            <Text style={styles.modalTitle}>Localização</Text>
            <TextInput
              style={styles.input}
              value={tempLocation}
              onChangeText={setTempLocation}
              placeholder="Cidade - UF"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.modalPrimary} onPress={saveLocation}>
              <Text style={styles.modalPrimaryTxt}>Salvar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  scrollPad: {
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backHit: {
    marginRight: 10,
    paddingVertical: 4,
  },
  backArrow: {
    fontSize: 24,
    color: NAVY,
    fontWeight: '700',
  },
  brand: {
    fontSize: 44,
    fontWeight: '900',
    color: NAVY,
    letterSpacing: -0.5,
    textAlign: 'left',
  },
  notifWrap: {
    padding: 8,
    position: 'relative',
  },
  bell: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E11D48',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  dateStrip: {
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateChip: {
    minWidth: 72,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateChipOn: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  dateChipWeek: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  dateChipWeekOn: {
    color: 'rgba(255,255,255,0.85)',
  },
  dateChipDay: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  dateChipDayOn: {
    color: '#FFFFFF',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  locBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pin: {
    marginRight: 8,
  },
  locTxt: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  link: {
    fontSize: 14,
    fontWeight: '800',
    color: NAVY,
  },
  filtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filtBtnTxt: {
    fontSize: 13,
    fontWeight: '800',
    color: NAVY,
  },
  chev: {
    color: NAVY,
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '700',
  },
  chips: {
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#EEF2F7',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipOn: {
    backgroundColor: '#E0E7FF',
    borderColor: NAVY,
  },
  chipTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: NAVY,
    marginTop: 8,
    marginBottom: 14,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8ECF2',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  time: {
    width: 48,
    fontSize: 15,
    fontWeight: '900',
    color: NAVY,
  },
  cardMid: {
    flex: 1,
    paddingHorizontal: 8,
  },
  pName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  pSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  check: {
    fontSize: 14,
    color: '#16A34A',
    fontWeight: '900',
  },
  stLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  stOff: {
    color: '#DC2626',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actIcon: {
    fontSize: 18,
  },
  chevCard: {
    fontSize: 22,
    color: '#94A3B8',
    fontWeight: '300',
    marginLeft: 4,
  },
  footerActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerLink: {
    paddingVertical: 10,
  },
  footerLinkTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: PAGE_PAD,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  opt: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optOn: {
    borderColor: NAVY,
    backgroundColor: '#E8EEF7',
  },
  optTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  optTxtOn: {
    color: NAVY,
    fontWeight: '800',
  },
  modalPrimary: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalPrimaryTxt: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  modalSecondary: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSecondaryTxt: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
});
