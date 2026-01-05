import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';

interface EmailVerificationScreenProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
  onResendCode?: () => void;
}

export default function EmailVerificationScreen({
  email,
  onBack,
  onSuccess,
  onResendCode,
}: EmailVerificationScreenProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      Alert.alert('Atenção', 'Por favor, digite o código de 6 dígitos');
      return;
    }

    setLoading(true);

    try {
      // Simulação de verificação - substituir por chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSuccess();
    } catch (error: any) {
      Alert.alert('Erro', 'Código inválido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      // Simulação de reenvio - substituir por chamada à API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Sucesso', 'Novo código enviado para seu email');
      onResendCode?.();
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível enviar novo código. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  const handleSupport = () => {
    Alert.alert('Suporte', 'Entre em contato com o suporte através do email: suporte@telemedicina.com');
  };

  return (
    <LinearGradient
      colors={[colors.gradient.top, colors.gradient.bottom]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        {/* Header com botão de voltar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verificação</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.instructionText}>
            Um código de verificação foi enviado para o seu email. Digite no campo abaixo.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Código</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.icon}>🔢</Text>
              <TextInput
                style={styles.input}
                placeholder="000000"
                placeholderTextColor="#999"
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={loading || code.length !== 6}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>VALIDAR</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendLink}
              onPress={handleResendCode}
              disabled={resending}
              activeOpacity={0.8}
            >
              <Text style={styles.resendText}>Não recebi um código de verificação</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleResendCode}
              disabled={resending}
              activeOpacity={0.8}
            >
              {resending ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.supportButtonText}>ENVIAR NOVO CÓDIGO</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleSupport}
              activeOpacity={0.8}
            >
              <Text style={styles.supportButtonText}>SUPORTE</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.envelopeContainer}>
            <Text style={styles.envelopeIcon}>✉️</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: colors.text.darkBlue,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.darkBlue,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    color: colors.text.primary,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resendLink: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  supportButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  envelopeContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  envelopeIcon: {
    fontSize: 120,
    opacity: 0.3,
  },
});

