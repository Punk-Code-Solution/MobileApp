import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { colors } from '../theme/colors';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    // Simular carregamento inicial (3 segundos)
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Logo ou Nome da Empresa */}
      <View style={styles.logoContainer}>
        <Text style={styles.companyName}>COMPANY NAME</Text>
        <Text style={styles.tagline}>Sua saúde em primeiro lugar</Text>
      </View>

      {/* Ilustração de Profissionais */}
      <View style={styles.illustrationContainer}>
        <Text style={styles.illustration}>👨‍⚕️👩‍⚕️</Text>
        <Text style={styles.illustrationText}>
          Profissionais de saúde prontos para cuidar de você
        </Text>
      </View>

      {/* Loading Indicator */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>

      {/* Copyright */}
      <View style={styles.copyrightContainer}>
        <Text style={styles.copyrightText}>
          © {new Date().getFullYear()} Punk Code Solution
        </Text>
        <Text style={styles.copyrightSubtext}>
          CNPJ: 61.805.210/0001-41
        </Text>
        <Text style={styles.copyrightSubtext}>
          Ilhéus - BA
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    fontSize: 120,
    marginBottom: 20,
  },
  illustrationText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 12,
  },
  copyrightContainer: {
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  copyrightText: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '600',
    marginBottom: 4,
  },
  copyrightSubtext: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
  },
});

