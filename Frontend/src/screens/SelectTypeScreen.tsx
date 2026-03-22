import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

interface SelectTypeScreenProps {
  onLogin: (userType: 'PATIENT' | 'PROFESSIONAL') => void;
  onRegister: (userType: 'PATIENT' | 'PROFESSIONAL') => void;
  loading?: boolean;
}

export default function SelectTypeScreen({
  onLogin,
  loading = false,
}: SelectTypeScreenProps) {
  const [userType, setUserType] = useState<'PATIENT' | 'PROFESSIONAL'>('PATIENT');

  const handleSelectTypeAndLogin = (selectedType: 'PATIENT' | 'PROFESSIONAL') => {
    if (loading) {
      return;
    }
    setUserType(selectedType);
    onLogin(selectedType);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.contentColumn}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoText}>Pronto</Text>
            <View style={styles.logoDivider} />
            <Text style={styles.tagline}>Conectando clientes e profissionais</Text>
          </View>

          <View style={styles.heroCenterWrap}>
            <View style={styles.heroBackground}>
              <LinearGradient
                colors={['rgba(255,255,255,0.78)', 'rgba(255,255,255,0.92)']}
                style={styles.heroOverlay}
              >
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      styles.roleButtonFilled,
                      userType === 'PATIENT' && styles.roleButtonActive,
                    ]}
                    onPress={() => handleSelectTypeAndLogin('PATIENT')}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <Text style={styles.roleButtonTextFilled}>Sou Cliente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      styles.roleButtonOutline,
                      userType === 'PROFESSIONAL' && styles.roleButtonActiveOutline,
                    ]}
                    onPress={() => handleSelectTypeAndLogin('PROFESSIONAL')}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <Text style={styles.roleButtonTextOutline}>Sou Profissional</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.footerWrap}>
            <Image
              source={require('../../assets/images/negocio4.png')}
              style={styles.footerImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Ocupa 100% da janela — evita faixas laterais/superiores do gradiente em aparelhos reais */
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  contentColumn: {
    flex: 1,
    width: '100%',
  },
  heroCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 1,
  },
  footerWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  footerImage: {
    width: '100%',
    height: 350,
    opacity: 0.5,
  },
  logoWrap: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
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
  heroBackground: {
    width: '100%',
    borderRadius: 25,
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
    paddingHorizontal: 10,
    marginTop: 10,
    gap: 10,
    borderRadius: 13,
    marginBottom: 10,
    
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
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 24,
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
    zIndex: 1,
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

