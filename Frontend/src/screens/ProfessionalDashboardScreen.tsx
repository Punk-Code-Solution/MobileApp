/**
 * Dashboard do profissional — métricas, chips, agenda do dia (mockup Servix / Pronto).
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import ProfessionalFinanceScreen from './ProfessionalFinanceScreen';
import { useHardwareBackPress } from '../hooks/useHardwareBackPress';

const PAGE_PAD = 22;
const NAVY = '#1A4A8E';
const USER_DATA_KEY = '@telemedicina:userData';
const LOCATION_KEY = '@telemedicina:patientLocationLabel';

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

interface ProfessionalDashboardScreenProps {
  token: string;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export default function ProfessionalDashboardScreen({
  token,
  onShowNotifications,
  unreadNotificationsCount = 0,
}: ProfessionalDashboardScreenProps) {
  const [view, setView] = useState<'dash' | 'finance'>('dash');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Dr(a).');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [rating, setRating] = useState(4.8);
  const [locationLabel, setLocationLabel] = useState('Ilhéus - BA');

  const load = useCallback(async () => {
    try {
      const data = await appointmentService.getMyAppointments(token, false);
      setAppointments(Array.isArray(data) ? data : []);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(USER_DATA_KEY);
        if (raw) {
          const u = JSON.parse(raw);
          const n =
            u?.fullName ||
            u?.professional?.fullName ||
            u?.name ||
            'Profissional';
          setUserName(n);
          setAvatarUrl(u?.professional?.avatarUrl || u?.avatarUrl);
          if (u?.professional?.averageRating != null) {
            setRating(Number(u.professional.averageRating));
          }
        }
        const loc = await AsyncStorage.getItem(LOCATION_KEY);
        if (loc) setLocationLabel(loc);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const today = useMemo(() => startOfDay(new Date()), []);
  const now = Date.now();

  const metrics = useMemo(() => {
    const todayList = appointments.filter((a) =>
      isSameDay(new Date(a.scheduledAt), today),
    );
    const todayCount = todayList.filter((a) => a.status !== 'CANCELED').length;
    const upcoming = appointments.filter(
      (a) =>
        new Date(a.scheduledAt).getTime() >= now &&
        !['CANCELED', 'COMPLETED'].includes(a.status),
    ).length;
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const newPatients = new Set(
      appointments
        .filter((a) => {
          const raw = (a as Appointment & { createdAt?: string }).createdAt || a.scheduledAt;
          return new Date(raw) >= monthStart;
        })
        .map((a) => a.patientId),
    ).size;
    const monthRev = appointments
      .filter((a) => {
        const d = new Date(a.scheduledAt);
        return (
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear() &&
          a.status === 'COMPLETED'
        );
      })
      .reduce((s, a) => s + (Number(a.price) || 0), 0);
    return {
      todayCount,
      upcoming,
      newPatients,
      monthRev,
    };
  }, [appointments, today, now]);

  const agendaToday = useMemo(() => {
    return appointments
      .filter(
        (a) =>
          isSameDay(new Date(a.scheduledAt), today) && a.status !== 'CANCELED',
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      )
      .slice(0, 8);
  }, [appointments, today]);

  const dashBackRef = useRef<() => boolean>(() => false);
  dashBackRef.current = () => false;
  useHardwareBackPress(() => dashBackRef.current());

  if (view === 'finance') {
    return (
      <ProfessionalFinanceScreen
        appointments={appointments}
        onBack={() => setView('dash')}
      />
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]} edges={['top', 'left', 'right']}>
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
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[NAVY]} />
        }
        contentContainerStyle={styles.scrollPad}
      >
        <View style={[styles.headerRow, { paddingHorizontal: PAGE_PAD }]}>
          <Text style={styles.brand}>Pronto</Text>
          <TouchableOpacity style={styles.bellWrap} onPress={onShowNotifications} hitSlop={8}>
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

        <View style={[styles.profileRow, { paddingHorizontal: PAGE_PAD }]}>
          <Image
            source={{
              uri:
                avatarUrl ||
                `https://ui-avatars.com/api/?background=4C4DDC&color=fff&size=128&name=${encodeURIComponent(
                  userName,
                )}`,
            }}
            style={styles.profileAvatar}
          />
          <View style={styles.profileText}>
            <Text style={styles.profileName} numberOfLines={2}>
              {userName}
            </Text>
            <Text style={styles.stars}>
              ⭐ {rating.toFixed(1).replace('.', ',')}
            </Text>
          </View>
        </View>

        <View style={[styles.metricsGrid, { paddingHorizontal: PAGE_PAD }]}>
          <View style={styles.metricCell}>
            <Text style={styles.metricIcon}>💼</Text>
            <Text style={styles.metricLabel}>Atendimentos hoje</Text>
            <Text style={styles.metricVal}>{metrics.todayCount}</Text>
          </View>
          <View style={styles.metricCell}>
            <Text style={styles.metricIcon}>🕐</Text>
            <Text style={styles.metricLabel}>Próximos</Text>
            <Text style={styles.metricVal}>{metrics.upcoming}</Text>
          </View>
          <View style={styles.metricCell}>
            <Text style={styles.metricIcon}>👥</Text>
            <Text style={styles.metricLabel}>Novos clientes</Text>
            <Text style={styles.metricVal}>{metrics.newPatients}</Text>
          </View>
          <View style={styles.metricCell}>
            <Text style={styles.metricIcon}>💰</Text>
            <Text style={styles.metricLabel}>Faturamento (mês)</Text>
            <Text style={styles.metricValSmall}>
              {metrics.monthRev.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.financeCta, { marginHorizontal: PAGE_PAD }]}
          onPress={() => setView('finance')}
          activeOpacity={0.88}
        >
          <Text style={styles.financeCtaTxt}>Abrir gestão financeira</Text>
          <Text style={styles.financeCtaChev}>›</Text>
        </TouchableOpacity>

        <View style={[styles.locRow, { marginHorizontal: PAGE_PAD }]}>
          <Text style={styles.pin}>📍</Text>
          <Text style={styles.locTxt} numberOfLines={1}>
            {locationLabel}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity style={styles.chip} activeOpacity={0.85}>
            <Text style={styles.chipIcon}>☰</Text>
            <Text style={styles.chipTxt} numberOfLines={1}>
              Tipos de Pagamento
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} activeOpacity={0.85}>
            <Text style={styles.chipIcon}>★</Text>
            <Text style={styles.chipTxt}>Avaliação 4.5+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} activeOpacity={0.85}>
            <Text style={styles.chipIcon}>📌</Text>
            <Text style={styles.chipTxt}>Mais relevantes</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[styles.agendaHeader, { paddingHorizontal: PAGE_PAD }]}>
          <Text style={styles.agendaTitle}>Agenda do dia</Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Horários',
                'Em breve você poderá gerir horários disponíveis aqui.',
              )
            }
          >
            <Text style={styles.agendaLink}>Gerir horários</Text>
          </TouchableOpacity>
        </View>

        {agendaToday.length === 0 ? (
          <Text style={[styles.emptyAgenda, { paddingHorizontal: PAGE_PAD }]}>
            Nenhum atendimento agendado para hoje.
          </Text>
        ) : (
          agendaToday.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.agendaRow, { marginHorizontal: PAGE_PAD }]}
              activeOpacity={0.85}
            >
              <Text style={styles.agendaTime}>{formatTime(a.scheduledAt)}</Text>
              <View style={styles.agendaMid}>
                <Text style={styles.agendaName} numberOfLines={1}>
                  {a.patient?.fullName || 'Paciente'}
                </Text>
                <Text style={styles.agendaSub}>⭐ 4,8</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity
          style={[styles.banner, { marginHorizontal: PAGE_PAD }]}
          activeOpacity={0.9}
        >
          <Text style={styles.bannerIcon}>📈</Text>
          <Text style={styles.bannerTxt}>
            {metrics.newPatients} novos clientes este mês pelo Pronto
          </Text>
          <Text style={styles.chev}>›</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollPad: { paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: { fontSize: 26, fontWeight: '800', color: NAVY },
  bellWrap: { position: 'relative' },
  bell: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeTxt: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 14,
  },
  profileText: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  stars: { marginTop: 4, fontSize: 14, color: '#64748B', fontWeight: '600' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  metricCell: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIcon: { fontSize: 20, marginBottom: 6 },
  metricLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  metricVal: { fontSize: 22, fontWeight: '800', color: NAVY },
  metricValSmall: { fontSize: 16, fontWeight: '800', color: NAVY },
  financeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8EEF7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: NAVY,
  },
  financeCtaTxt: { fontSize: 15, fontWeight: '800', color: NAVY, flex: 1 },
  financeCtaChev: { fontSize: 22, color: NAVY, fontWeight: '700' },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pin: { marginRight: 6, fontSize: 16 },
  locTxt: { flex: 1, fontSize: 14, color: '#334155', fontWeight: '600' },
  chipsRow: {
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipIcon: { marginRight: 6, fontSize: 14, color: NAVY },
  chipTxt: { fontSize: 12, fontWeight: '600', color: '#334155', maxWidth: 160 },
  agendaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  agendaTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  agendaLink: { fontSize: 13, fontWeight: '800', color: NAVY },
  emptyAgenda: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  agendaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  agendaTime: {
    width: 52,
    fontSize: 15,
    fontWeight: '800',
    color: NAVY,
  },
  agendaMid: { flex: 1, minWidth: 0 },
  agendaName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  agendaSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  chev: { fontSize: 20, color: '#94a3b8' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 10,
  },
  bannerIcon: { fontSize: 22 },
  bannerTxt: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0369a1' },
});
