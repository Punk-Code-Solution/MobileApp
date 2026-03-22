/**
 * Gestão financeira — perfil profissional (layout inspirado no mockup Servix).
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appointment } from '../types/appointment.types';
import { useHardwareBackPress } from '../hooks/useHardwareBackPress';

const PAGE_PAD = 22;
const NAVY = '#1A4A8E';

interface ProfessionalFinanceScreenProps {
  appointments: Appointment[];
  onBack: () => void;
}

function formatMoney(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ProfessionalFinanceScreen({
  appointments,
  onBack,
}: ProfessionalFinanceScreenProps) {
  useHardwareBackPress(() => {
    onBack();
    return true;
  });

  const { monthTotal, received, paidList, platformShare } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const completed = appointments.filter(
      (a) =>
        a.status === 'COMPLETED' &&
        new Date(a.scheduledAt).getFullYear() === y &&
        new Date(a.scheduledAt).getMonth() === m,
    );
    const total = completed.reduce((s, a) => s + (Number(a.price) || 0), 0);
    const received = total * 0.85;
    const platform = total * 0.15;
    const paidList = completed.slice(0, 6);
    return {
      monthTotal: total,
      received,
      paidList,
      platformShare: platform,
    };
  }, [appointments]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={[styles.header, { paddingHorizontal: PAGE_PAD }]}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.backHit}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestão Financeira</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.metricsRow, { paddingHorizontal: PAGE_PAD }]}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Faturamento do mês</Text>
            <Text style={styles.metricValue}>{formatMoney(monthTotal)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Valor recebido</Text>
            <Text style={styles.metricValue}>{formatMoney(received)}</Text>
          </View>
        </View>

        <View style={[styles.chartCard, { marginHorizontal: PAGE_PAD }]}>
          <Text style={styles.chartTitle}>Atendimentos realizados</Text>
          <Text style={styles.chartBig}>
            {
              appointments.filter((a) => {
                const d = new Date(a.scheduledAt);
                const n = new Date();
                return (
                  a.status === 'COMPLETED' &&
                  d.getMonth() === n.getMonth() &&
                  d.getFullYear() === n.getFullYear()
                );
              }).length
            }
          </Text>
          <View style={styles.chartBars}>
            {[40, 55, 35, 70, 50, 65, 45].map((h, i) => (
              <View key={i} style={styles.barWrap}>
                <View style={[styles.bar, { height: Math.max(10, Math.round((h / 100) * 88)) }]} />
              </View>
            ))}
          </View>
          <Text style={styles.chartAxis}>Últimos meses</Text>
        </View>

        <Text style={[styles.sectionTitle, { paddingHorizontal: PAGE_PAD }]}>Atendimentos pagos</Text>
        {paidList.length === 0 ? (
          <Text style={[styles.empty, { paddingHorizontal: PAGE_PAD }]}>
            Nenhum atendimento concluído neste mês.
          </Text>
        ) : (
          paidList.map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.payRow, { marginHorizontal: PAGE_PAD }]}
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=${encodeURIComponent(
                    NAVY,
                  )}&color=fff&size=96&name=${encodeURIComponent(a.patient?.fullName || 'P')}`,
                }}
                style={styles.payAvatar}
              />
              <View style={styles.payMid}>
                <Text style={styles.payName} numberOfLines={1}>
                  {a.patient?.fullName || 'Paciente'}
                </Text>
                <Text style={styles.paySub} numberOfLines={1}>
                  Consulta
                </Text>
              </View>
              <Text style={styles.payPrice}>{formatMoney(Number(a.price) || 0)}</Text>
              <Text style={styles.chev}>›</Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={[styles.footerNote, { paddingHorizontal: PAGE_PAD }]}>
          Receita gerada pelo Pronto: {formatMoney(platformShare)} vindos da plataforma (estimativa).
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backHit: { padding: 4 },
  backArrow: { fontSize: 24, color: NAVY, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  scroll: { flex: 1 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  metricLabel: { fontSize: 12, color: '#64748B', marginBottom: 8, fontWeight: '600' },
  metricValue: { fontSize: 18, fontWeight: '800', color: NAVY },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 20,
  },
  chartTitle: { fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 4 },
  chartBig: { fontSize: 36, fontWeight: '800', color: NAVY, marginBottom: 12 },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
    marginBottom: 8,
  },
  barWrap: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    backgroundColor: NAVY,
    borderRadius: 4,
    minHeight: 8,
  },
  chartAxis: { fontSize: 11, color: '#94a3b8', textAlign: 'center' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  empty: { fontSize: 14, color: '#64748B' },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8ECF4',
  },
  payAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  payMid: { flex: 1, minWidth: 0 },
  payName: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  paySub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  payPrice: { fontSize: 15, fontWeight: '800', color: NAVY, marginRight: 4 },
  chev: { fontSize: 20, color: '#94a3b8' },
  footerNote: {
    marginTop: 16,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
