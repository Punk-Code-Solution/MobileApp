/**
 * Clientes — perfil profissional (mockup Servix).
 * Lista derivada dos agendamentos da API.
 */

import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import { useHardwareBackPress } from '../hooks/useHardwareBackPress';

const PAGE_PAD = 22;
const NAVY = '#1A4A8E';
const USER_DATA_KEY = '@telemedicina:userData';

type ClientFilter = 'all' | 'attended' | 'returns';

interface ClientRow {
  patientId: string;
  name: string;
  phone?: string;
  lastAt?: string;
  nextAt?: string;
  appointmentCount: number;
  completedCount: number;
}

interface ProfessionalClientsScreenProps {
  token: string;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
}

function formatShort(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProfessionalClientsScreen({
  token,
  onShowNotifications,
  unreadNotificationsCount = 0,
}: ProfessionalClientsScreenProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<ClientFilter>('all');
  const [userName, setUserName] = useState('Profissional');

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
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const clients = useMemo((): ClientRow[] => {
    const byPatient = new Map<string, Appointment[]>();
    for (const a of appointments) {
      if (!a.patient?.id) continue;
      if (!byPatient.has(a.patient.id)) byPatient.set(a.patient.id, []);
      byPatient.get(a.patient.id)!.push(a);
    }
    const now = Date.now();
    const rows: ClientRow[] = [];
    for (const [, list] of byPatient) {
      const pid = list[0].patient!.id;
      const name = list[0].patient!.fullName || 'Paciente';
      const phone = list[0].patient!.phone;
      const sorted = [...list].sort(
        (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      );
      const completedCount = list.filter((a) => a.status === 'COMPLETED').length;
      const future = sorted.filter(
        (a) => new Date(a.scheduledAt).getTime() >= now && a.status !== 'CANCELED',
      );
      const past = sorted.filter((a) => new Date(a.scheduledAt).getTime() < now);
      const nextAt = future[0]?.scheduledAt;
      const lastFromPast = past.length ? past[past.length - 1].scheduledAt : undefined;
      const lastCompleted = [...list]
        .filter((a) => a.status === 'COMPLETED')
        .sort(
          (a, b) =>
            new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
        )[0];
      const lastAt = lastCompleted?.scheduledAt || lastFromPast || sorted[0]?.scheduledAt;
      rows.push({
        patientId: pid,
        name,
        phone,
        lastAt,
        nextAt,
        appointmentCount: list.length,
        completedCount,
      });
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const filtered = useMemo(() => {
    let list = clients;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (chip === 'attended') {
      list = list.filter((c) => c.completedCount > 0);
    } else if (chip === 'returns') {
      list = list.filter((c) => c.appointmentCount > 1);
    }
    return list;
  }, [clients, query, chip]);

  const backRef = useRef<() => boolean>(() => false);
  backRef.current = () => false;
  useHardwareBackPress(() => backRef.current());

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.topBar, { paddingHorizontal: PAGE_PAD }]}>
        <TouchableOpacity style={styles.brandHit} hitSlop={8}>
          <Text style={styles.brand}>Pronto</Text>
        </TouchableOpacity>
        <Text style={styles.welcome}>Olá, {userName.split(' ')[0]}</Text>
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

      <Text style={[styles.pageTitle, { paddingHorizontal: PAGE_PAD }]}>Clientes</Text>

      <View style={[styles.searchWrap, { marginHorizontal: PAGE_PAD }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente"
          placeholderTextColor="#94a3b8"
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={[styles.chipsRow, { paddingHorizontal: PAGE_PAD }]}>
        {(
          [
            ['all', 'Todos'],
            ['attended', 'Atendimentos'],
            ['returns', 'Retornos'],
          ] as const
        ).map(([id, label]) => {
          const active = chip === id;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.chip, active && styles.chipOn]}
              onPress={() => setChip(id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipTxt, active && styles.chipTxtOn]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={NAVY} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.patientId}
          contentContainerStyle={{ paddingHorizontal: PAGE_PAD, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[NAVY]} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum cliente encontrado.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.88}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=4C4DDC&color=fff&size=128&name=${encodeURIComponent(
                    item.name,
                  )}`,
                }}
                style={styles.avatar}
              />
              <View style={styles.cardBody}>
                <Text style={styles.clientName}>{item.name}</Text>
                <Text style={styles.meta}>
                  Último atendimento: {formatShort(item.lastAt)}
                </Text>
                <Text style={styles.meta}>Próximo: {formatShort(item.nextAt)}</Text>
              </View>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  brandHit: { alignSelf: 'flex-start' },
  brand: { fontSize: 22, fontWeight: '800', color: NAVY },
  welcome: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#64748B' },
  bellWrap: { position: 'relative' },
  bell: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: -4,
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#0f172a' },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5EAF2',
  },
  chipOn: {
    backgroundColor: NAVY,
    borderColor: NAVY,
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  chipTxtOn: {
    color: '#FFFFFF',
  },
  loader: { flex: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 12 },
  cardBody: { flex: 1, minWidth: 0 },
  clientName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  meta: { fontSize: 12, color: '#64748B', marginTop: 2 },
  chev: { fontSize: 22, color: '#94a3b8' },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 24 },
});
