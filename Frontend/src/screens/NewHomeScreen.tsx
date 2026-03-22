import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useHardwareBackPress } from '../hooks/useHardwareBackPress';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Professional } from '../types/appointment.types';
import ProfessionalDetailsScreen from './ProfessionalDetailsScreen';
import AppointmentBooking from './AppointmentBooking';
import SearchScreen from './SearchScreen';
import { professionalService } from '../services/api/professional.service';
import {
  QUICK_CATEGORIES,
  MACRO_CATEGORIES,
  specialtyMatchesKeywords,
  type QuickCategoryId,
  type MacroCategoryId,
} from '../constants/patientHomeCategories';

const USER_DATA_KEY = '@telemedicina:userData';
const LOCATION_KEY = '@telemedicina:patientLocationLabel';

/** Alinhado ao mockup e às margens da SelectTypeScreen (padding horizontal ~22) */
const PAGE_PAD = 22;

const NAVY = '#1A4A8E';

interface NewHomeScreenProps {
  token: string;
  onLogout: () => void;
  onShowNotifications?: () => void;
  unreadNotificationsCount?: number;
}

type ScreenState = 'home' | 'details' | 'booking' | 'search';

type FilterKind = { kind: 'quick'; id: QuickCategoryId } | { kind: 'macro'; id: MacroCategoryId };

function specialtyLower(prof: Professional): string {
  return (
    prof.specialties?.[0]?.specialty?.name?.toLowerCase().trim() ||
    prof.specialties?.map((s) => s.specialty?.name).join(' ').toLowerCase() ||
    ''
  );
}

function fakeDistanceKm(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h + id.charCodeAt(i) * (i + 1)) % 997;
  }
  const km = 0.5 + (h % 80) / 10;
  return km.toFixed(1).replace('.', ',');
}

export default function NewHomeScreen({
  token,
  onLogout: _onLogout,
  onShowNotifications,
  unreadNotificationsCount = 0,
}: NewHomeScreenProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [screenState, setScreenState] = useState<ScreenState>('home');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [doctors, setDoctors] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState<string>('Usuário');
  const [locationLabel, setLocationLabel] = useState('Ilhéus - BA');
  const [categoryFilter, setCategoryFilter] = useState<FilterKind | null>(null);
  const [minRating45, setMinRating45] = useState(false);
  const [paymentFilterLabel, setPaymentFilterLabel] = useState<string | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tempLocation, setTempLocation] = useState('');
  const [modalMinRating, setModalMinRating] = useState(0);

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const userDataString = await AsyncStorage.getItem(USER_DATA_KEY);
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const name =
            userData?.fullName ||
            userData?.patient?.fullName ||
            userData?.professional?.fullName ||
            userData?.name ||
            'Usuário';
          setUserName(name);
        }
        const savedLoc = await AsyncStorage.getItem(LOCATION_KEY);
        if (savedLoc) {
          setLocationLabel(savedLoc);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };
    loadUserName();
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      const doctorsData = await professionalService.getAll(token);
      const doctorsArray = Array.isArray(doctorsData) ? doctorsData : [];
      setDoctors(doctorsArray);
    } catch (error: any) {
      console.error('Erro ao buscar profissionais:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDoctors();
  }, [fetchDoctors]);

  const specialtyName = (professional: Professional) =>
    professional.specialties?.[0]?.specialty?.name || 'Especialista';

  const effectiveMinRating = useMemo(() => {
    let m = modalMinRating;
    if (minRating45) {
      m = Math.max(m, 4.5);
    }
    return m;
  }, [modalMinRating, minRating45]);

  const filteredDoctors = useMemo(() => {
    let list = Array.isArray(doctors) ? [...doctors] : [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const name = d.fullName?.toLowerCase() || '';
        const spec = specialtyLower(d);
        return name.includes(q) || spec.includes(q);
      });
    }

    if (categoryFilter) {
      if (categoryFilter.kind === 'quick') {
        const def = QUICK_CATEGORIES.find((c) => c.id === categoryFilter.id);
        if (def) {
          list = list.filter((d) => specialtyMatchesKeywords(specialtyLower(d), def.keywords));
        }
      } else {
        const def = MACRO_CATEGORIES.find((c) => c.id === categoryFilter.id);
        if (def) {
          list = list.filter((d) => specialtyMatchesKeywords(specialtyLower(d), def.keywords));
        }
      }
    }

    if (effectiveMinRating > 0) {
      list = list.filter((d) => (d.averageRating ?? 0) >= effectiveMinRating);
    }

    return list;
  }, [doctors, searchQuery, categoryFilter, effectiveMinRating]);

  const toggleQuickCategory = (id: QuickCategoryId) => {
    setCategoryFilter((prev) =>
      prev?.kind === 'quick' && prev.id === id ? null : { kind: 'quick', id },
    );
  };

  const toggleMacroCategory = (id: MacroCategoryId) => {
    setCategoryFilter((prev) =>
      prev?.kind === 'macro' && prev.id === id ? null : { kind: 'macro', id },
    );
  };

  const handleProfessionalPress = (professional: Professional) => {
    setSelectedProfessional(professional);
    setScreenState('details');
  };

  const handleBookAppointment = (professional: Professional) => {
    setSelectedProfessional(professional);
    setScreenState('booking');
  };

  const handleBackToHome = () => {
    setScreenState('home');
    setSelectedProfessional(null);
  };

  const handleBookingSuccess = () => {
    setTimeout(() => {
      setScreenState('home');
      setSelectedProfessional(null);
      setTimeout(() => fetchDoctors(), 100);
    }, 0);
  };

  const handleBookingCancel = () => {
    setScreenState('details');
  };

  const handleSearchPress = () => {
    setScreenState('search');
  };

  const handleBackFromSearch = () => {
    setScreenState('home');
  };

  const handleSelectProfessionalFromSearch = (professional: Professional) => {
    setSelectedProfessional(professional);
    setScreenState('details');
  };

  const openLocationModal = () => {
    setTempLocation(locationLabel);
    setShowLocationModal(true);
  };

  const saveLocation = async () => {
    const t = tempLocation.trim() || 'Ilhéus - BA';
    setLocationLabel(t);
    try {
      await AsyncStorage.setItem(LOCATION_KEY, t);
    } catch (_) {
      /* ignore */
    }
    setShowLocationModal(false);
  };

  const applyAdvancedFilters = (rating: number) => {
    setModalMinRating(rating);
    if (rating < 4.5 && minRating45) {
      setMinRating45(false);
    }
    setShowFiltersModal(false);
  };

  const newHomeBackRef = useRef<() => boolean>(() => false);
  newHomeBackRef.current = () => {
    if (screenState !== 'home') {
      return false;
    }
    if (showPaymentModal) {
      setShowPaymentModal(false);
      return true;
    }
    if (showFiltersModal) {
      setShowFiltersModal(false);
      return true;
    }
    if (showLocationModal) {
      setShowLocationModal(false);
      return true;
    }
    return false;
  };
  useHardwareBackPress(() => newHomeBackRef.current());

  if (screenState === 'search') {
    return (
      <SearchScreen
        token={token}
        onBack={handleBackFromSearch}
        onSelectProfessional={handleSelectProfessionalFromSearch}
      />
    );
  }

  if (screenState === 'details' && selectedProfessional) {
    return (
      <ProfessionalDetailsScreen
        professional={selectedProfessional}
        onBack={handleBackToHome}
        onBookAppointment={handleBookAppointment}
      />
    );
  }

  if (screenState === 'booking' && selectedProfessional) {
    return (
      <AppointmentBooking
        professional={selectedProfessional}
        token={token}
        onSuccess={handleBookingSuccess}
        onCancel={handleBookingCancel}
      />
    );
  }

  const macroCardWidth = (id: MacroCategoryId) => {
    const base = MACRO_CATEGORIES.find((m) => m.id === id);
    if (base?.wide) {
      return Math.min(windowWidth - PAGE_PAD * 2, 200);
    }
    return 132;
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeTop}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        style={styles.scrollRoot}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[NAVY]}
            tintColor={NAVY}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Topo: notificações (mantém funcionalidade) */}
        <View style={[styles.topRow, { paddingHorizontal: PAGE_PAD }]}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.notifBtn} onPress={onShowNotifications} activeOpacity={0.7}>
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadNotificationsCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Busca — mockup */}
        <View style={[styles.searchWrap, { marginHorizontal: PAGE_PAD }]}>
          <Text style={styles.searchGlyph}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Qual profissional você está procurando?"
            placeholderTextColor="#8A96BC"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>

        {/* Categorias — linha 1 */}
        <Text style={[styles.sectionLabel, { paddingHorizontal: PAGE_PAD }]}>Categorias</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hScrollPad}
        >
          {QUICK_CATEGORIES.map((cat) => {
            const active = categoryFilter?.kind === 'quick' && categoryFilter.id === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.quickCat, active && styles.quickCatActive]}
                onPress={() => toggleQuickCategory(cat.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.quickCatIcon}>{cat.icon}</Text>
                <Text style={[styles.quickCatLabel, active && styles.quickCatLabelActive]} numberOfLines={2}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Categorias — linha 2 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.hScrollPad, { paddingBottom: 8 }]}
        >
          {MACRO_CATEGORIES.map((cat) => {
            const active = categoryFilter?.kind === 'macro' && categoryFilter.id === cat.id;
            const w = macroCardWidth(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.macroCat,
                  { width: w },
                  cat.wide && styles.macroCatWide,
                  active && styles.macroCatActive,
                ]}
                onPress={() => toggleMacroCategory(cat.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.macroIcon}>{cat.icon}</Text>
                <Text style={[styles.macroLabel, active && styles.macroLabelActive]} numberOfLines={2}>
                  {cat.label}
                </Text>
                {!!cat.subtitle && <Text style={styles.macroSub}>{cat.subtitle}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Local + Filtros */}
        <View style={[styles.locRow, { marginHorizontal: PAGE_PAD }]}>
          <View style={styles.locBar}>
            <Text style={styles.pin}>📍</Text>
            <Text style={styles.locText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <TouchableOpacity onPress={openLocationModal} hitSlop={8}>
              <Text style={styles.link}>Alterar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.filterPill} onPress={() => setShowFiltersModal(true)} activeOpacity={0.85}>
            <Text style={styles.filterPillText}>Filtros</Text>
            <Text style={styles.chev}>⌄</Text>
          </TouchableOpacity>
        </View>

        {/* Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, paymentFilterLabel && styles.chipOn]}
            onPress={() => setShowPaymentModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.chipIcon}>☰</Text>
            <Text style={styles.chipTxt} numberOfLines={1}>
              {paymentFilterLabel ? `Pag.: ${paymentFilterLabel}` : 'Tipos de Pagamento'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, minRating45 && styles.chipOn]}
            onPress={() => setMinRating45((v) => !v)}
            activeOpacity={0.85}
          >
            <Text style={styles.chipIcon}>★</Text>
            <Text style={styles.chipTxt}>Avaliação 4.5+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, modalMinRating > 0 && styles.chipOn]}
            onPress={() => setShowFiltersModal(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.chipIcon}>⚙</Text>
            <Text style={styles.chipTxt}>Mais filtros</Text>
          </TouchableOpacity>
        </ScrollView>

        <Text style={[styles.listTitle, { paddingHorizontal: PAGE_PAD }]}>Profissionais próximos a você</Text>

        {loading ? (
          <ActivityIndicator size="large" color={NAVY} style={styles.loader} />
        ) : filteredDoctors.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Nenhum profissional encontrado</Text>
            <Text style={styles.emptySub}>Ajuste os filtros ou a busca.</Text>
          </View>
        ) : (
          filteredDoctors.map((doctor) => {
            const rating = doctor.averageRating != null ? doctor.averageRating.toFixed(1) : '—';
            const stars = Math.min(5, Math.round(doctor.averageRating ?? 0));
            return (
              <View key={doctor.id} style={[styles.card, { marginHorizontal: PAGE_PAD }]}>
                <TouchableOpacity activeOpacity={0.75} onPress={() => handleProfessionalPress(doctor)}>
                  <View style={styles.cardTop}>
                    <Image
                      source={{
                        uri:
                          doctor.avatarUrl ||
                          `https://ui-avatars.com/api/?background=E8EEF7&color=1A4A8E&size=128&name=${encodeURIComponent(
                            doctor.fullName,
                          )}`,
                      }}
                      style={styles.cardAvatar}
                    />
                    <View style={styles.cardBody}>
                      <Text style={styles.cardName}>{doctor.fullName}</Text>
                      <Text style={styles.cardSpec}>{specialtyName(doctor)}</Text>
                      <View style={styles.cardMeta}>
                        <Text style={styles.starsSmall}>
                          {'★'.repeat(stars)}
                          {'☆'.repeat(5 - stars)}
                        </Text>
                        <Text style={styles.ratingNum}>{rating}</Text>
                        <Text style={styles.dist}>
                          📍 {fakeDistanceKm(doctor.id)} km
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.agendarBtn}
                  onPress={() => handleBookAppointment(doctor)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.agendarTxt}>Agendar atendimento</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        <TouchableOpacity style={[styles.verBusca, { marginHorizontal: PAGE_PAD }]} onPress={handleSearchPress}>
          <Text style={styles.verBuscaTxt}>Busca avançada</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modal local */}
      <Modal visible={showLocationModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowLocationModal(false)}>
          <Pressable style={styles.modalBox}>
            <Text style={styles.modalTitle}>Sua localização</Text>
            <TextInput
              style={styles.modalInput}
              value={tempLocation}
              onChangeText={setTempLocation}
              placeholder="Cidade - UF"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.modalBtn} onPress={saveLocation}>
              <Text style={styles.modalBtnTxt}>Salvar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal filtros avançados */}
      <Modal visible={showFiltersModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowFiltersModal(false)}>
          <Pressable style={styles.modalBox}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <Text style={styles.modalHint}>Nota mínima (0 = qualquer)</Text>
            <View style={styles.ratingPick}>
              {[0, 3, 3.5, 4, 4.5, 5].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rPickBtn, modalMinRating === r && styles.rPickBtnOn]}
                  onPress={() => applyAdvancedFilters(r)}
                >
                  <Text style={[styles.rPickTxt, modalMinRating === r && styles.rPickTxtOn]}>
                    {r === 0 ? 'Qualquer' : `${r}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalBtn, { marginTop: 12, backgroundColor: '#64748B' }]}
              onPress={() => {
                setModalMinRating(0);
                setShowFiltersModal(false);
              }}
            >
              <Text style={styles.modalBtnTxt}>Limpar nota mínima</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal pagamento — preferência visual; sem campo na API, não altera lista */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPaymentModal(false)}>
          <Pressable style={styles.modalBox}>
            <Text style={styles.modalTitle}>Tipos de pagamento</Text>
            {(['Pix', 'Cartão', 'Dinheiro', 'Qualquer'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.payRow}
                onPress={() => {
                  setPaymentFilterLabel(opt === 'Qualquer' ? null : opt);
                  setShowPaymentModal(false);
                }}
              >
                <Text style={styles.payRowTxt}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeTop: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollRoot: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 8,
  },
  notifBtn: {
    padding: 8,
    position: 'relative',
  },
  notifIcon: {
    fontSize: 22,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  searchGlyph: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A2E',
    paddingVertical: 0,
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  hScrollPad: {
    paddingHorizontal: PAGE_PAD,
    gap: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  quickCat: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickCatActive: {
    borderColor: NAVY,
    backgroundColor: '#F0F4FF',
  },
  quickCatIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  quickCatLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  quickCatLabelActive: {
    color: NAVY,
  },
  macroCat: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    padding: 12,
    marginRight: 10,
    justifyContent: 'center',
    minHeight: 96,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  macroCatWide: {
    paddingHorizontal: 14,
  },
  macroCatActive: {
    borderColor: NAVY,
    backgroundColor: '#F0F4FF',
  },
  macroIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  macroLabelActive: {
    color: NAVY,
  },
  macroSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  locBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pin: {
    marginRight: 8,
    fontSize: 16,
  },
  locText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5EAF2',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: NAVY,
  },
  chev: {
    marginLeft: 4,
    color: NAVY,
    fontSize: 14,
  },
  chipsRow: {
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 12,
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
    maxWidth: 220,
  },
  chipOn: {
    backgroundColor: '#E8EEF7',
    borderColor: NAVY,
  },
  chipIcon: {
    marginRight: 6,
    fontSize: 14,
    color: NAVY,
  },
  chipTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    marginBottom: 14,
  },
  loader: {
    marginVertical: 40,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: PAGE_PAD,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8ECF4',
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    padding: 14,
  },
  cardAvatar: {
    width: 72,
    height: 72,
    borderRadius: 12,
    marginRight: 12
  },
  cardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardSpec: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  starsSmall: {
    fontSize: 11,
    color: '#FBBF24',
    letterSpacing: -2,
  },
  ratingNum: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  dist: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  agendarBtn: {
    backgroundColor: NAVY,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendarTxt: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  verBusca: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 8,
  },
  verBuscaTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: PAGE_PAD,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
    color: '#0f172a',
  },
  modalBtn: {
    backgroundColor: NAVY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalBtnTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  ratingPick: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rPickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  rPickBtnOn: {
    borderColor: NAVY,
    backgroundColor: '#E8EEF7',
  },
  rPickTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  rPickTxtOn: {
    color: NAVY,
  },
  payRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  payRowTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
});
