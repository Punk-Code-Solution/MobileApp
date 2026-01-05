import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { colors } from '../theme/colors';
import { Professional } from '../types/appointment.types';
import ProfessionalDetailsScreen from './ProfessionalDetailsScreen';
import AppointmentBooking from './AppointmentBooking';

const API_URL = 'http://10.0.2.2:3000';

interface NewHomeScreenProps {
  token: string;
  onLogout: () => void;
}

type ScreenState = 'home' | 'details' | 'booking';

export default function NewHomeScreen({ token, onLogout }: NewHomeScreenProps) {
  const [screenState, setScreenState] = useState<ScreenState>('home');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [doctors, setDoctors] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_URL}/professionals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Garantir que sempre seja um array
      const doctorsData = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response.data?.data) 
        ? response.data.data 
        : [];
      
      console.log('Doctors recebidos:', doctorsData.length);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setDoctors([]); // Garantir que seja um array vazio em caso de erro
    } finally {
      setLoading(false);
    }
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
    setScreenState('home');
    setSelectedProfessional(null);
    fetchDoctors();
  };

  const handleBookingCancel = () => {
    setScreenState('details');
  };

  // Tela de detalhes
  if (screenState === 'details' && selectedProfessional) {
    return (
      <ProfessionalDetailsScreen
        professional={selectedProfessional}
        onBack={handleBackToHome}
        onBookAppointment={handleBookAppointment}
      />
    );
  }

  // Tela de agendamento
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

  // Tela principal (Home)
  const specialtyName = (professional: Professional) =>
    professional.specialties?.[0]?.specialty?.name || 'Especialista';
  const priceFormatted = (professional: Professional) =>
    professional.price ? Number(professional.price).toFixed(2) : '0.00';

  // Filtrar médicos baseado na busca
  const filteredDoctors = Array.isArray(doctors) 
    ? doctors.filter((doctor) => {
        if (!searchQuery.trim()) {
          return true; // Se não houver busca, mostrar todos
        }

        const query = searchQuery.toLowerCase().trim();
        const doctorName = doctor?.fullName?.toLowerCase() || '';
        const specialty = specialtyName(doctor).toLowerCase();

        // Buscar por nome do médico ou especialidade
        return doctorName.includes(query) || specialty.includes(query);
      })
    : [];

  // Limitar a quantidade de resultados (5 se não houver busca, todos se houver)
  const displayedDoctors = searchQuery.trim()
    ? filteredDoctors
    : filteredDoctors.slice(0, 5);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Azul */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.greeting}>Olá, Usuário!</Text>
            <Text style={styles.subtitle}>Como podemos ajudar hoje?</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar serviços ou profissionais..."
            placeholderTextColor={colors.text.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Serviços em destaque</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            {displayedDoctors.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
                <Text style={styles.emptyText}>
                  Tente buscar por outra especialidade ou nome do profissional.
                </Text>
              </View>
            ) : (
              displayedDoctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id}
                  style={styles.doctorCard}
                  onPress={() => handleProfessionalPress(doctor)}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{
                        uri:
                          doctor.avatarUrl ||
                          `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                            doctor.fullName
                          )}`,
                      }}
                      style={styles.avatar}
                    />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorSpecialty}>{specialtyName(doctor)}</Text>
                    <Text style={styles.doctorName}>{doctor.fullName}</Text>
                    <View style={styles.doctorFooter}>
                      <Text style={styles.doctorPrice}>R$ {priceFormatted(doctor)}</Text>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.star}>⭐</Text>
                        <Text style={styles.rating}>4.5</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {!searchQuery.trim() && displayedDoctors.length > 0 && (
              <TouchableOpacity style={styles.seeMoreButton} activeOpacity={0.7}>
                <Text style={styles.seeMoreText}>Ver mais</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  doctorCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorSpecialty: {
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
  doctorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
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
  seeMoreButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  seeMoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
