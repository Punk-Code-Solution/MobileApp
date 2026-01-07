import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';
import { Professional } from '../types/appointment.types';

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
  const specialtyName = professional.specialties?.[0]?.specialty?.name || 'Especialista';
  const priceFormatted = professional.price ? Number(professional.price).toFixed(2) : '0.00';
  const rating = professional.averageRating ? professional.averageRating.toFixed(1) : '0.0';
  const reviewsCount = professional.reviewsCount || 0;

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
            <Text style={styles.infoText}>Duração: 30min - 40min</Text>
            <Text style={styles.infoText}>Atendimento online</Text>
            <Text style={styles.infoText}>Disponível para agendamento</Text>
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
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#90EE90',
    marginRight: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  professionalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  specialty: {
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
  infoSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
  },
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

