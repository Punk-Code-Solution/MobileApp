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
import AlertModal from '../components/AlertModal';
import { userService } from '../services/api/user.service';

interface CompletePatientProfileScreenProps {
  token: string;
  onComplete: () => void;
  onBack?: () => void;
}

export default function CompletePatientProfileScreen({
  token,
  onComplete,
  onBack,
}: CompletePatientProfileScreenProps) {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const { showToast } = useToast();

  const formatCpf = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/\.$|-$/g, '');
    }
    return cpf;
  };

  const handleCpfChange = (value: string) => {
    const formatted = formatCpf(value);
    setCpf(formatted);
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3').replace(/\($| $|-$/g, '');
      } else {
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3').replace(/\($| $|-$/g, '');
      }
    }
    return phone;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
  };

  const handleSubmit = async () => {
    // Validações
    if (!fullName || !cpf || !phone || !birthDate) {
      showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    // Validação básica de CPF (11 dígitos)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      showToast('CPF deve ter 11 dígitos', 'warning');
      return;
    }

    // Validação de data de nascimento
    const birthDateObj = new Date(birthDate);
    if (isNaN(birthDateObj.getTime())) {
      showToast('Data de nascimento inválida. Use o formato YYYY-MM-DD', 'warning');
      return;
    }

    // Verificar se a data não é no futuro
    if (birthDateObj > new Date()) {
      showToast('Data de nascimento não pode ser no futuro', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados
      const phoneDigits = phone.replace(/\D/g, '');
      
      await userService.completePatientProfile(token, {
        fullName,
        phone: phoneDigits,
        cpf: cpfDigits,
        birthDate: birthDateObj.toISOString(),
      });

      setSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao completar perfil:', error);
      let errorMessage = 'Não foi possível completar o cadastro. Tente novamente.';
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.gradient.top, colors.gradient.bottom]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Completar Cadastro</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Mensagem de aviso */}
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>Cadastro Incompleto</Text>
            <Text style={styles.warningText}>
              Para agendar consultas, é necessário completar seu cadastro com os dados abaixo.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nome completo *</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>👤</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Fulano de Tal"
                  placeholderTextColor="#999"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>CPF *</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>🆔</Text>
                <TextInput
                  style={styles.input}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#999"
                  value={cpf}
                  onChangeText={handleCpfChange}
                  keyboardType="numeric"
                  maxLength={14}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Telefone *</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>📱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor="#999"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data de Nascimento *</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>📅</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1990-01-01"
                  placeholderTextColor="#999"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  keyboardType="default"
                />
              </View>
              <Text style={styles.helperText}>Formato: YYYY-MM-DD (ex: 1990-01-01)</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>COMPLETAR CADASTRO</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal de Sucesso */}
        <AlertModal
          visible={successModal}
          title="Cadastro Completo! ✅"
          message="Seu cadastro foi completado com sucesso. Agora você pode agendar consultas!"
          type="success"
          onConfirm={() => {
            setSuccessModal(false);
            onComplete();
          }}
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 20,
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    marginLeft: 40,
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
});

