import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';
import { useToast } from '../hooks/useToast';
import AlertModal from '../components/AlertModal';

interface RateAppointmentScreenProps {
  appointment: Appointment;
  token: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function RateAppointmentScreen({
  appointment,
  token,
  onBack,
  onSuccess,
}: RateAppointmentScreenProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const { showToast } = useToast();

  const professionalName = appointment.professional?.fullName || 'Profissional';
  const specialtyName =
    appointment.professional?.specialties?.[0]?.specialty?.name || 'Especialista';
  const professionalAvatar = appointment.professional?.avatarUrl;

  // Formatar data da consulta
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formatar horário da consulta
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const MAX_COMMENT_LENGTH = 500;

  const isSubmittingRef = useRef(false);

  const handleSubmit = async () => {
    // Proteção contra múltiplos cliques
    if (isSubmittingRef.current || loading) {
      return;
    }

    if (rating === 0) {
      showToast('Por favor, selecione uma avaliação.', 'warning');
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      showToast(`O comentário não pode ter mais de ${MAX_COMMENT_LENGTH} caracteres.`, 'warning');
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    
    try {
      // Chamada à API para salvar avaliação
      await appointmentService.rateAppointment(token, appointment.id, {
        rating,
        comment: comment.trim() || undefined,
      });

      setSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao avaliar consulta:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Não foi possível enviar sua avaliação. Tente novamente.';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleCommentChange = (text: string) => {
    if (text.length <= MAX_COMMENT_LENGTH) {
      setComment(text);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            activeOpacity={0.7}
            style={styles.starButton}
          >
            <Text style={[styles.star, star <= rating && styles.starFilled]}>
              {star <= rating ? '⭐' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
        <Text style={styles.headerTitle}>Avaliar Consulta</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Professional Info Card */}
        <View style={styles.professionalCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  professionalAvatar ||
                  `https://ui-avatars.com/api/?background=4CAF50&color=fff&size=128&name=${encodeURIComponent(
                    professionalName
                  )}`,
              }}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.professionalName}>{professionalName}</Text>
          <Text style={styles.specialty}>{specialtyName}</Text>
          <View style={styles.appointmentInfo}>
            <Text style={styles.appointmentDate}>
              📅 {formatDate(appointment.scheduledAt)}
            </Text>
            <Text style={styles.appointmentTime}>
              🕐 {formatTime(appointment.scheduledAt)}
            </Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como foi sua experiência?</Text>
          <Text style={styles.sectionSubtitle}>
            Sua opinião é muito importante para nós
          </Text>
          {renderStars()}
          {rating > 0 && (
            <View style={styles.ratingFeedback}>
              <Text style={styles.ratingText}>
                {rating === 1 && '😞 Péssimo'}
                {rating === 2 && '😕 Ruim'}
                {rating === 3 && '😐 Regular'}
                {rating === 4 && '😊 Bom'}
                {rating === 5 && '😍 Excelente'}
              </Text>
            </View>
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentários (opcional)</Text>
          <Text style={styles.sectionSubtitle}>
            Compartilhe detalhes sobre sua consulta
          </Text>
          <TextInput
            style={[
              styles.commentInput,
              comment.length >= MAX_COMMENT_LENGTH && styles.commentInputLimit,
            ]}
            placeholder="Ex: O atendimento foi excelente, o médico foi muito atencioso e esclareceu todas as minhas dúvidas..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={handleCommentChange}
            textAlignVertical="top"
            maxLength={MAX_COMMENT_LENGTH}
          />
          <View style={styles.charCountContainer}>
            <Text
              style={[
                styles.charCount,
                comment.length >= MAX_COMMENT_LENGTH && styles.charCountLimit,
              ]}
            >
              {comment.length}/{MAX_COMMENT_LENGTH}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={rating === 0 || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Enviar Avaliação</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Sucesso */}
      <AlertModal
        visible={successModal}
        title="Sucesso! ✅"
        message="Sua avaliação foi enviada com sucesso."
        type="success"
        onConfirm={() => {
          setSuccessModal(false);
          if (onSuccess) {
            onSuccess();
          } else {
            onBack();
          }
        }}
      />
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
    paddingBottom: 40,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  professionalName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  specialty: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  appointmentInfo: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  appointmentDate: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  appointmentTime: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
    width: '100%',
  },
  starButton: {
    flex: 1,
    maxWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 44,
  },
  starFilled: {
    // Estrela preenchida já usa emoji ⭐
  },
  ratingFeedback: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },
  commentInput: {
    backgroundColor: '#F8F8FC',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 140,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    textAlignVertical: 'top',
  },
  commentInputLimit: {
    borderColor: '#FF9800',
    backgroundColor: '#FFF8F0',
  },
  charCountContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  charCountLimit: {
    color: '#FF9800',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 32,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

