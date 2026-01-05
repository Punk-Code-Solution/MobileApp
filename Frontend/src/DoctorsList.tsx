import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar
} from 'react-native';
import { colors } from './theme/colors';
import AppointmentBooking from './screens/AppointmentBooking';
import { Professional } from './types/appointment.types';
import { professionalService } from './services/api/professional.service'; 

interface DoctorsListProps {
  token: string;
  onLogout: () => void;
}

export default function DoctorsList({ token, onLogout }: DoctorsListProps) {
  const [doctors, setDoctors] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const doctorsData = await professionalService.getAll(token);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (error) {
      // Falha silenciosa ou alerta suave
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (professional: Professional) => {
    setSelectedProfessional(professional);
  };

  const handleBookingSuccess = () => {
    setSelectedProfessional(null);
    // Opcional: Recarregar a lista de médicos ou mostrar mensagem de sucesso
    fetchDoctors();
  };

  const handleBookingCancel = () => {
    setSelectedProfessional(null);
  };

  // Se um profissional foi selecionado, mostra a tela de agendamento
  if (selectedProfessional) {
    return (
      <AppointmentBooking
        professional={selectedProfessional}
        token={token}
        onSuccess={handleBookingSuccess}
        onCancel={handleBookingCancel}
      />
    );
  }

  const renderDoctorItem = ({ item }: { item: Professional }) => {
    // Tratamento de erros de dados
    const specialtyName = item.specialties?.[0]?.specialty?.name || 'Especialista';
    const priceFormatted = item.price ? Number(item.price).toFixed(2) : '0.00';

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          {/* Avatar com fundo suave e gradiente */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBackground} />
            <Image 
              source={{ 
                uri: item.avatarUrl || 
                `https://ui-avatars.com/api/?background=4C4DDC&color=fff&size=128&name=${encodeURIComponent(item.fullName)}` 
              }} 
              style={styles.avatar} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <View style={styles.nameContainer}>
                <Text style={styles.doctorName} numberOfLines={1}>{item.fullName}</Text>
                {item.licenseNumber && (
                  <Text style={styles.license}>CRM {item.licenseNumber}</Text>
                )}
              </View>
              <View style={styles.ratingContainer}>
                <Text style={styles.ratingIcon}>⭐</Text>
                <Text style={styles.rating}>4.8</Text>
              </View>
            </View>
            
            <View style={styles.specialtyContainer}>
              <Text style={styles.specialtyIcon}>🏥</Text>
              <Text style={styles.specialty}>{specialtyName}</Text>
            </View>
            
            {item.bio && (
              <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
            )}
          </View>
        </View>

        {/* Linha Divisória */}
        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.priceContainer}>
             <Text style={styles.priceLabel}>Consulta</Text>
             <Text style={styles.priceValue}>R$ {priceFormatted}</Text>
          </View>

          <TouchableOpacity 
            style={styles.bookButton} 
            onPress={() => handleBookAppointment(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.bookButtonText}>Agendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header Estilo App */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Bem-vindo 👋</Text>
          <Text style={styles.title}>Encontre seu Médico</Text>
        </View>
        <TouchableOpacity 
          onPress={onLogout} 
          style={styles.iconButton}
          activeOpacity={0.7}
        >
          <Text style={styles.iconButtonText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de Busca Melhorado */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Buscar especialista...</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={renderDoctorItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum médico encontrado.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: { 
    fontSize: 14, 
    color: colors.text.secondary, 
    marginBottom: 4,
    fontWeight: '500',
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  iconButton: { 
    padding: 12, 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  iconButtonText: {
    fontSize: 20,
  },

  searchContainer: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    opacity: 0.6,
  },
  searchPlaceholder: { 
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },

  list: { padding: 24 },
  empty: { textAlign: 'center', marginTop: 50, color: colors.text.secondary },

  // CARD DESIGN (Baseado no Healtec)
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    marginBottom: 20,
    padding: 20,
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  cardContent: { 
    flexDirection: 'row', 
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80, 
    height: 80, 
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  avatar: { 
    width: 80, 
    height: 80, 
    borderRadius: 24,
    zIndex: 1,
  },
  
  textContainer: { 
    flex: 1, 
    justifyContent: 'center',
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  doctorName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text.primary,
    marginBottom: 4,
  },
  license: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  rating: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#F57C00',
  },
  
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialtyIcon: {
    fontSize: 14,
    marginRight: 6,
    opacity: 0.7,
  },
  specialty: { 
    fontSize: 14, 
    color: colors.text.secondary,
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 4,
  },

  divider: { 
    height: 1, 
    backgroundColor: colors.border, 
    marginVertical: 16,
  },

  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: { 
    fontSize: 12, 
    color: colors.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  priceValue: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: colors.primary,
    letterSpacing: -0.5,
  },

  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bookButtonText: { 
    color: '#FFF', 
    fontWeight: '600', 
    fontSize: 15,
    letterSpacing: 0.5,
  }
});