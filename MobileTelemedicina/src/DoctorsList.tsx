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
import axios from 'axios';
import { colors } from './theme/colors';
import AppointmentBooking from './screens/AppointmentBooking';
import { Professional } from './types/appointment.types';

// MANTENHA O SEU IP AQUI (Se for 10.0.2.2 ou o IP da rede)
const API_URL = 'http://10.0.2.2:3000'; 

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
      const response = await axios.get(`${API_URL}/professionals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
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
          {/* Avatar com fundo suave */}
          <View style={styles.avatarContainer}>
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
              <Text style={styles.doctorName} numberOfLines={1}>{item.fullName}</Text>
              <Text style={styles.rating}>⭐ 4.8</Text>
            </View>
            
            <Text style={styles.specialty}>{specialtyName}</Text>
            <Text style={styles.location}>🏥 Hospital Central</Text>
          </View>
        </View>

        {/* Linha Divisória */}
        <View style={styles.divider} />

        <View style={styles.footer}>
          <View>
             <Text style={styles.priceLabel}>Preço da Consulta</Text>
             <Text style={styles.priceValue}>R$ {priceFormatted}</Text>
          </View>

          <TouchableOpacity 
            style={styles.bookButton} 
            onPress={() => handleBookAppointment(item)}
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
        <View>
          <Text style={styles.greeting}>Bem-vindo 👋</Text>
          <Text style={styles.title}>Encontre seu Médico</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.iconButton}>
           {/* Simulando ícone de sair */}
           <Text style={{fontSize: 20}}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de Busca Falso (Visual apenas) */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchPlaceholder}>🔍  Buscar especialista...</Text>
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
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 14, color: colors.text.secondary, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text.primary },
  iconButton: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },

  searchContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  searchPlaceholder: { color: '#999' },

  list: { padding: 24 },
  empty: { textAlign: 'center', marginTop: 50, color: colors.text.secondary },

  // CARD DESIGN (Baseado no Healtec)
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24, // Bordas bem arredondadas como no design
    marginBottom: 20,
    padding: 20,
    elevation: 4, // Sombra Android
    shadowColor: '#4C4DDC', // Sombra azulada no iOS
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  cardContent: { flexDirection: 'row', marginBottom: 16 },
  avatarContainer: {
    width: 70, height: 70, borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16
  },
  avatar: { width: 70, height: 70, borderRadius: 20 },
  
  textContainer: { flex: 1, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: colors.text.primary, width: '80%' },
  rating: { fontSize: 12, fontWeight: 'bold', color: '#FFB800' },
  
  specialty: { fontSize: 14, color: colors.text.secondary, marginTop: 4 },
  location: { fontSize: 12, color: colors.text.secondary, marginTop: 4, opacity: 0.8 },

  divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 12, color: colors.text.secondary },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: colors.primary },

  bookButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30, // Botão Pill (Pílula)
  },
  bookButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});