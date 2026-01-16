import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Professional } from '../types/appointment.types';
import { professionalService } from '../services/api/professional.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@telemedicina:token';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  patient: {
    fullName: string;
    avatarUrl: string | null;
  };
}

interface ProfessionalDetailsScreenProps {
  professional: Professional;
  onBack: () => void;
  onBookAppointment: (professional: Professional) => void;
}

export default function ProfessionalDetailsScreen({
  professional,
  onBack,
  onBookAppointment,
}: ProfessionalDetailsScreenProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        console.log('[PROFESSIONAL-DETAILS] Token carregado:', storedToken ? 'Sim' : 'Não');
        setToken(storedToken);
      } catch (error) {
        console.error('[PROFESSIONAL-DETAILS] Erro ao carregar token:', error);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!token || !professional.id) {
        console.log('[PROFESSIONAL-DETAILS] Não foi possível buscar avaliações:', {
          hasToken: !!token,
          professionalId: professional.id,
        });
        setLoadingReviews(false);
        return;
      }

      try {
        console.log('[PROFESSIONAL-DETAILS] Buscando avaliações para profissional:', professional.id);
        setLoadingReviews(true);
        const reviewsData = await professionalService.getReviews(token, professional.id);
        console.log('[PROFESSIONAL-DETAILS] Avaliações recebidas:', {
          count: reviewsData?.length || 0,
          reviews: reviewsData,
        });
        setReviews(reviewsData || []);
      } catch (error: any) {
        console.error('[PROFESSIONAL-DETAILS] Erro ao buscar avaliações:', {
          error,
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
          professionalId: professional.id,
        });
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [token, professional.id]);

  const specialtyName = professional.specialties?.[0]?.specialty?.name || 'Especialista';
  const priceFormatted = professional.price ? Number(professional.price).toFixed(2) : '0.00';
  const rating = professional.averageRating ? professional.averageRating.toFixed(1) : '0.0';
  const reviewsCount = professional.reviewsCount || 0;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.starIcon}>
        {index < rating ? '⭐' : '☆'}
      </Text>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Azul Escuro */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card Branco Principal */}
        <View style={styles.card}>
          {/* Informações do Médico */}
          <View style={styles.professionalHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    professional.avatarUrl ||
                    `https://ui-avatars.com/api/?background=90EE90&color=fff&size=128&name=${encodeURIComponent(
                      professional.fullName
                    )}`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.professionalInfo}>
              <Text style={styles.specialty}>{specialtyName}</Text>
              <Text style={styles.doctorName}>{professional.fullName}</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.star}>⭐</Text>
                <Text style={styles.rating}>{rating} ({reviewsCount})</Text>
              </View>
            </View>
          </View>

          {/* Informações da Consulta */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>⏱️ Duração:</Text>
              <Text style={styles.infoText}>30min - 40min</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>💻 Modalidade:</Text>
              <Text style={styles.infoText}>Atendimento online</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>✅ Status:</Text>
              <Text style={styles.infoText}>Disponível para agendamento</Text>
            </View>
          </View>

          {/* Descrição */}
          {professional.bio && (
            <View style={styles.descriptionSection}>
              <Text style={styles.descriptionTitle}>Descrição</Text>
              <Text style={styles.descriptionText}>
                {professional.bio || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
              </Text>
            </View>
          )}

          {/* Preço e Botão */}
          <View style={styles.footer}>
            <Text style={styles.price}>R$ {priceFormatted}</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => onBookAppointment(professional)}
              activeOpacity={0.8}
            >
              <Text style={styles.bookButtonText}>AGENDAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seção de Avaliações */}
        <View style={styles.reviewsCard}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.reviewsTitle}>Avaliações</Text>
            {reviewsCount > 0 && (
              <Text style={styles.reviewsCount}>({reviewsCount})</Text>
            )}
          </View>

          {loadingReviews ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Carregando avaliações...</Text>
            </View>
          ) : reviews.length === 0 ? (
            <View style={styles.noReviewsContainer}>
              <Text style={styles.noReviewsText}>
                Ainda não há avaliações para este profissional.
              </Text>
            </View>
          ) : (
            <View style={styles.reviewsList}>
              {reviews.map((review, index) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewItem,
                    index === reviews.length - 1 && styles.reviewItemLast,
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewPatientInfo}>
                      <View style={styles.reviewAvatar}>
                        <Text style={styles.reviewAvatarText}>
                          {review.patient.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.reviewPatientDetails}>
                        <Text style={styles.reviewPatientName}>
                          {review.patient.fullName}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {formatDate(review.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.reviewStars}>
                      {renderStars(review.rating)}
                    </View>
                  </View>
                  {review.comment && review.comment.trim().length > 0 ? (
                    <Text style={styles.reviewComment}>{review.comment.trim()}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
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
    backgroundColor: colors.navigation.darkBlue,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  professionalHeader: {
    flexDirection: 'row',
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: '#90EE90',
    marginRight: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 16,
  },
  professionalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  specialty: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  doctorName: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 10,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  star: {
    fontSize: 16,
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 28,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: colors.text.secondary,
    marginRight: 8,
    minWidth: 100,
  },
  infoText: {
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },
  descriptionSection: {
    marginBottom: 28,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  reviewsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  reviewsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryLight,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginRight: 8,
    letterSpacing: 0.3,
  },
  reviewsCount: {
    fontSize: 16,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 15,
    color: colors.text.secondary,
  },
  noReviewsContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  noReviewsText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  reviewsList: {
    gap: 20,
  },
  reviewItem: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  reviewPatientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  reviewPatientDetails: {
    flex: 1,
  },
  reviewPatientName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  starIcon: {
    fontSize: 16,
  },
  reviewComment: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 22,
    marginTop: 10,
    paddingLeft: 62,
  },
  reviewCommentEmpty: {
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 22,
    marginTop: 10,
    paddingLeft: 62,
  },
});

