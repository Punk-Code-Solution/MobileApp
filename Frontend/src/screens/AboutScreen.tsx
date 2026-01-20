import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface AboutScreenProps {
  onBack: () => void;
}

export default function AboutScreen({ onBack }: AboutScreenProps) {
  const currentYear = new Date().getFullYear();

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
        <Text style={styles.headerTitle}>Sobre o App</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo/Ícone do App */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🏥</Text>
          </View>
          <Text style={styles.appName}>Telemedicina</Text>
          <Text style={styles.appVersion}>Versão 1.0.0</Text>
        </View>

        {/* Informações da Empresa */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desenvolvido por</Text>
          <View style={styles.companyCard}>
            <Text style={styles.companyName}>Punk Code Solution</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CNPJ:</Text>
              <Text style={styles.infoValue}>61.805.210/0001-41</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Endereço:</Text>
              <Text style={styles.infoValue}>Rua do Aconchego</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cidade:</Text>
              <Text style={styles.infoValue}>Ilhéus - BA</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CEP:</Text>
              <Text style={styles.infoValue}>45656-627</Text>
            </View>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={styles.copyrightText}>
            © {currentYear} Punk Code Solution
          </Text>
          <Text style={styles.copyrightSubtext}>
            Todos os direitos reservados.
          </Text>
        </View>

        {/* Informações Adicionais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre o Aplicativo</Text>
          <Text style={styles.descriptionText}>
            Aplicativo de telemedicina desenvolvido para facilitar o acesso a
            consultas médicas online, conectando pacientes e profissionais de
            saúde de forma segura e eficiente.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navigation.darkBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 12,
    backgroundColor: colors.navigation.darkBlue,
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoText: {
    fontSize: 50,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 16,
  },
  companyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '600',
    minWidth: 90,
  },
  infoValue: {
    fontSize: 15,
    color: colors.text.primary,
    flex: 1,
  },
  copyrightSection: {
    alignItems: 'center',
    marginVertical: 32,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  copyrightText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 24,
    textAlign: 'justify',
  },
});
