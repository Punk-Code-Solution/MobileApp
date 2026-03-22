import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';
import { useToast } from '../hooks/useToast';

interface LoginScreenProps {
  onLogin: (email: string, password: string, role: 'PATIENT' | 'PROFESSIONAL') => Promise<void>;
  onForgotPassword: () => void;
  onCreateAccount: () => void;
  onBackToSelectType: () => void;
  selectedUserType: 'PATIENT' | 'PROFESSIONAL';
  loading?: boolean;
}

export default function LoginScreen({
  onLogin,
  onForgotPassword,
  onCreateAccount,
  onBackToSelectType,
  selectedUserType,
  loading = false,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { showToast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Preencha email e senha', 'warning');
      return;
    }

    await onLogin(email, password, selectedUserType);
  };

  return (
    <LinearGradient
      colors={['#0E4EA8', '#EAF1F8']}
      style={styles.gradient}
    >
      <SafeAreaView edges={['left', 'right']} style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.phoneFrame}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoText}>Pronto</Text>
              <View style={styles.logoDivider} />
              <Text style={styles.tagline}>Conectando clientes e profissionais</Text>
              <TouchableOpacity onPress={onBackToSelectType}>
                <Text style={styles.changeTypeLink}>
                  Entrando como {selectedUserType === 'PATIENT' ? 'Cliente' : 'Profissional'} - alterar
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="#8A96BC"
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
                  <TextInput
                    style={styles.input}
                    placeholder="********"
                    placeholderTextColor="#8A96BC"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.buttonText}>ENTRAR</Text>
                )}
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Nao tem conta? </Text>
                <TouchableOpacity onPress={onCreateAccount}>
                  <Text style={styles.signupLink}>Criar conta</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View >
                <Image source={require('../../assets/images/negocio4.png')} style={styles.footerImage} />
              </View>
        </View>

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
  footerImage: {
    width: '100%',
    height: 450,
    opacity: 0.5,
    bottom: 30,
  },
  phoneFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    borderWidth: 5,
    borderColor: '#0B4A9D',
    overflow: 'hidden',
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
    shadowColor: '#002451',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 9,
  },
  logoWrap: {
    paddingTop: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#06439A',
    letterSpacing: 0.5,
  },
  logoDivider: {
    width: 220,
    height: 2,
    backgroundColor: '#2D72C3',
    marginTop: 4,
  },
  tagline: {
    marginTop: 14,
    fontSize: 17,
    color: '#4D596D',
    fontWeight: '500',
    textAlign: 'center',
  },
  changeTypeLink: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#0A56B7',
  },
  heroBackground: {
    marginTop: 22,
    marginHorizontal: 22,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5ECF5',
  },
  heroOverlay: {
    paddingVertical: 26,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27456F',
    marginBottom: 10,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgotPasswordLink: {
    fontSize: 13,
    color: '#0A56B7',
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D2DFEE',
    paddingHorizontal: 14,
  },
  icon: {
    fontSize: 18,
    color: '#2E5E9A',
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
  },
  roleSelector: {
    gap: 14,
  },
  roleButton: {
    minHeight: 60,
    borderRadius: 13,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  roleButtonFilled: {
    backgroundColor: '#0254B6',
    borderColor: '#0254B6',
  },
  roleButtonOutline: {
    backgroundColor: '#FFFFFF',
    borderColor: '#0A56B7',
  },
  roleButtonActive: {
    backgroundColor: '#01479B',
    borderColor: '#01479B',
  },
  roleButtonActiveOutline: {
    backgroundColor: '#E9F2FF',
  },
  roleButtonTextFilled: {
    fontSize: 33 / 2,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  roleButtonTextOutline: {
    fontSize: 33 / 2,
    fontWeight: '700',
    color: '#0A56B7',
  },
  formCard: {
    marginTop: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6EDF7',
    padding: 16,
  },
  button: {
    backgroundColor: '#0A56B7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: '#64748B',
  },
  signupLink: {
    fontSize: 14,
    color: '#0A56B7',
    fontWeight: '600',
  },
});

