import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Appointment } from '../types/appointment.types';
import { appointmentService } from '../services/api/appointment.service';

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

  const professionalName = appointment.professional?.fullName || 'Profissional';
  const specialtyName =
    appointment.professional?.specialties?.[0]?.specialty?.name || 'Especialista';

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Atenção', 'Por favor, selecione uma avaliação.');
      return;
    }

    setLoading(true);
    try {
      // Chamada à API para salvar avaliação
      await appointmentService.rateAppointment(token, appointment.id, {
        rating,
        comment: comment.trim() || undefined,
      });

      Alert.alert('Sucesso! ✅', 'Sua avaliação foi enviada com sucesso.', [
        {
          text: 'OK',
          onPress: () => {
            if (onSuccess) {
              onSuccess();
            } else {
              onBack();
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Erro ao avaliar consulta:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Não foi possível enviar sua avaliação. Tente novamente.';
      Alert.alert('Erro', errorMessage);
    } finally {
      setLoading(false);
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avaliar Consulta</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional Info */}
        <View style={styles.professionalCard}>
          <Text style={styles.professionalName}>{professionalName}</Text>
          <Text style={styles.specialty}>{specialtyName}</Text>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como foi sua experiência?</Text>
          {renderStars()}
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Péssimo'}
              {rating === 2 && 'Ruim'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bom'}
              {rating === 5 && 'Excelente'}
            </Text>
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentários (opcional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Conte-nos mais sobre sua experiência..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
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
  content: {
    flex: 1,
    backgroundColor: '#F8F8FC',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  professionalName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  specialty: {
    fontSize: 16,
    color: colors.text.secondary,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  starButton: {
    padding: 8,
  },
  star: {
    fontSize: 40,
    color: '#DDD',
  },
  starFilled: {
    color: '#FFD700',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 8,
  },
  commentInput: {
    backgroundColor: '#F8F8FC',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  charCount: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'right',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: colors.primary,
    marginHorizontal: 20,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

