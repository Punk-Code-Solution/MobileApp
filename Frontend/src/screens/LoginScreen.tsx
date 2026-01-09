import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';
import { useToast } from '../hooks/useToast';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role: 'PATIENT' | 'PROFESSIONAL') => Promise<void>;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  loading?: boolean;
}

export default function LoginScreen({
  onLogin,
  onForgotPassword,
  onCreateAccount,
  loading = false,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'PATIENT' | 'PROFESSIONAL'>('PATIENT');
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Preencha email e senha', 'warning');
      return;
    }

    await onLogin(email, password, userType);
  };

  return (
    <LinearGradient
      colors={[colors.gradient.top, colors.gradient.bottom]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Personagens médicos */}
          <View style={styles.charactersContainer}>
            <Text style={styles.characterLeft}>👩‍⚕️</Text>
            <Text style={styles.characterRight}>👨‍⚕️</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seu@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Senha</Text>
                <TouchableOpacity onPress={onForgotPassword}>
                  <Text style={styles.forgotPasswordLink}>Esqueceu a senha?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Entrar como:</Text>
              <View style={styles.roleSelector}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    userType === 'PATIENT' && styles.roleButtonActive,
                  ]}
                  onPress={() => setUserType('PATIENT')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      userType === 'PATIENT' && styles.roleButtonTextActive,
                    ]}
                  >
                    Cliente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    userType === 'PROFESSIONAL' && styles.roleButtonActive,
                  ]}
                  onPress={() => setUserType('PROFESSIONAL')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      userType === 'PROFESSIONAL' && styles.roleButtonTextActive,
                    ]}
                  >
                    Profissional
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>ENTRAR</Text>
              )}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Não tem conta? </Text>
              <TouchableOpacity onPress={onCreateAccount}>
                <Text style={styles.signupLink}>Criar conta</Text>
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 40,
  },
  charactersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  characterLeft: {
    fontSize: 80,
    transform: [{ scaleX: -1 }],
  },
  characterRight: {
    fontSize: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.darkBlue,
    marginBottom: 12,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotPasswordLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: colors.text.primary,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  signupLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

