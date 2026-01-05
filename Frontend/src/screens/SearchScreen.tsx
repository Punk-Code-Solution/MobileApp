import React, { useState, useEffect } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Professional } from '../types/appointment.types';
import { professionalService } from '../services/api/professional.service';
import ProfessionalDetailsScreen from './ProfessionalDetailsScreen';

interface SearchScreenProps {
  token: string;
  onBack: () => void;
  onSelectProfessional?: (professional: Professional) => void;
}

type ScreenState = 'search' | 'details';

export default function SearchScreen({ token, onBack, onSelectProfessional }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>('search');

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    // Filtrar profissionais baseado na busca
    if (!searchQuery.trim()) {
      setFilteredProfessionals(professionals);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = professionals.filter((professional) => {
      const name = professional.fullName?.toLowerCase() || '';
      const specialty = professional.specialties?.[0]?.specialty?.name?.toLowerCase() || '';
      return name.includes(query) || specialty.includes(query);
    });

    setFilteredProfessionals(filtered);
  }, [searchQuery, professionals]);

  const fetchProfessionals = async () => {
    try {
      setLoading(true);
      const data = await professionalService.getAll(token);
      const professionalsArray = Array.isArray(data) ? data : [];
      setProfessionals(professionalsArray);
      setFilteredProfessionals(professionalsArray);
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      setProfessionals([]);
      setFilteredProfessionals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionalPress = (professional: Professional) => {
    setSelectedProfessional(professional);
    setScreenState('details');
  };

  const handleBackToSearch = () => {
    setScreenState('search');
    setSelectedProfessional(null);
  };

  // Tela de detalhes
  if (screenState === 'details' && selectedProfessional) {
    return (
      <ProfessionalDetailsScreen
        professional={selectedProfessional}
        token={token}
        onBack={handleBackToSearch}
        onBookAppointment={(professional) => {
          if (onSelectProfessional) {
            onSelectProfessional(professional);
          }
        }}
      />
    );
  }

  const renderProfessionalItem = ({ item }: { item: Professional }) => {
    const specialtyName = item.specialties?.[0]?.specialty?.name || 'Especialista';
    const priceFormatted = item.price ? Number(item.price).toFixed(2) : '0.00';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleProfessionalPress(item)}
        activeOpacity={0.7}
      >
        <Image
          source={{
            uri:
              item.avatarUrl ||
              `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                item.fullName || 'Médico'
              )}`,
          }}
          style={styles.avatar}
        />
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.fullName}</Text>
          <Text style={styles.specialty}>{specialtyName}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={styles.rating}>4.5</Text>
          </View>
          <Text style={styles.price}>R$ {priceFormatted}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buscar Profissional</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou especialidade..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredProfessionals.length} {filteredProfessionals.length === 1 ? 'resultado' : 'resultados'}
            </Text>
            <FlatList
              data={filteredProfessionals}
              keyExtractor={(item) => item.id}
              renderItem={renderProfessionalItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
                  <Text style={styles.emptyText}>
                    Tente buscar por outro nome ou especialidade
                  </Text>
                </View>
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 50,
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
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 18,
    color: '#999',
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  resultsText: {
    fontSize: 14,
    color: colors.text.secondary,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#90EE90',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '500',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 4,
  },
  arrowContainer: {
    marginLeft: 12,
  },
  arrow: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

