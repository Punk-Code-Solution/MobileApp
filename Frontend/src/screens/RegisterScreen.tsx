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
import { authService } from '../services/api/auth.service';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: (email: string) => void;
}

type UserType = 'PATIENT' | 'PROFESSIONAL';

export default function RegisterScreen({ onBack, onSuccess }: RegisterScreenProps) {
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [userType, setUserType] = useState<UserType>('PATIENT');
  const [profession, setProfession] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const { showToast } = useToast();

  const handleRegister = async () => {
    // Validações
    if (!fullName || !cpf || !email || !password || !confirmPassword) {
      showToast('Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    if (userType === 'PATIENT' && !phone) {
      showToast('Preencha o campo Telefone', 'warning');
      return;
    }

    if (userType === 'PATIENT' && !birthDate) {
      showToast('Preencha o campo Data de Nascimento', 'warning');
      return;
    }

    if (userType === 'PROFESSIONAL' && !licenseNumber) {
      showToast('Preencha o campo CRM/Registro Profissional', 'warning');
      return;
    }

    if (userType === 'PROFESSIONAL' && !price) {
      showToast('Preencha o campo Valor da Consulta', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('As senhas não coincidem', 'warning');
      return;
    }

    if (!email.includes('@')) {
      showToast('Por favor, insira um email válido', 'warning');
      return;
    }

    // Validação básica de CPF (11 dígitos)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      showToast('CPF deve ter 11 dígitos', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para registro
      const registerData: any = {
        fullName,
        email,
        password,
        role: userType,
        phone: phone.replace(/\D/g, ''), // Remove formatação do telefone
        cpf: cpfDigits,
      };

      // Dados específicos para PATIENT
      if (userType === 'PATIENT') {
        // Converter data de nascimento de DD/MM/YYYY para ISO string
        const birthDateObj = parseBirthDate(birthDate);
        if (!birthDateObj) {
          showToast('Data de nascimento inválida. Use o formato DD/MM/AAAA', 'warning');
          setLoading(false);
          return;
        }
        
        // Verificar se a data não é no futuro
        if (birthDateObj > new Date()) {
          showToast('Data de nascimento não pode ser no futuro', 'warning');
          setLoading(false);
          return;
        }
        
        registerData.birthDate = birthDateObj.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }

      // Dados específicos para PROFESSIONAL
      if (userType === 'PROFESSIONAL') {
        registerData.licenseNumber = licenseNumber;
        registerData.price = parseFloat(price.replace(',', '.')) || 0;
      }

      // Chamar API de registro
      await authService.register(registerData);
      
      setSuccessModal(true);
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      let errorMessage = 'Não foi possível realizar o cadastro. Tente novamente.';
      
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

  const formatBirthDate = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMYYYY)
    const limited = numbers.slice(0, 8);
    
    // Aplica a máscara DD/MM/YYYY
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 4) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    } else {
      return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
    }
  };

  const handleBirthDateChange = (value: string) => {
    const formatted = formatBirthDate(value);
    setBirthDate(formatted);
  };

  const parseBirthDate = (dateString: string): Date | null => {
    // Remove formatação (barras)
    const numbers = dateString.replace(/\D/g, '');
    
    // Deve ter 8 dígitos (DDMMYYYY)
    if (numbers.length !== 8) {
      return null;
    }
    
    const day = parseInt(numbers.slice(0, 2), 10);
    const month = parseInt(numbers.slice(2, 4), 10);
    const year = parseInt(numbers.slice(4, 8), 10);
    
    // Validação básica
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
      return null;
    }
    
    // Cria a data (mês no Date é 0-indexed, então subtrai 1)
    const date = new Date(year, month - 1, day);
    
    // Verifica se a data é válida (ex: 31/02 não é válido)
    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return null;
    }
    
    return date;
  };

  return (
    <LinearGradient
      colors={[colors.gradient.top, colors.gradient.bottom]}
      style={styles.gradient}
    >
      <SafeAreaView edges={['left', 'right']} style={styles.container}>
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
          <Text style={styles.headerTitle}>Cadastro</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Personagens médicos */}
          <View style={styles.charactersContainer}>
            <Text style={styles.characterLeft}>👨‍⚕️</Text>
            <Text style={styles.characterRight}>👩‍⚕️</Text>
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
              <Text style={styles.label}>Email *</Text>
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
              <Text style={styles.label}>Senha *</Text>
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
              <Text style={styles.label}>Confirmar senha *</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.icon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>
            </View>

            {userType === 'PATIENT' && (
              <>
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
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Data de Nascimento *</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.icon}>📅</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor="#999"
                      value={birthDate}
                      onChangeText={handleBirthDateChange}
                      keyboardType="numeric"
                      maxLength={10}
                    />
                  </View>
                  <Text style={styles.helperText}>Formato: DD/MM/AAAA (ex: 15/05/1990)</Text>
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Cadastrar como:</Text>
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

            {userType === 'PROFESSIONAL' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Profissão *</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.icon}>💼</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Médico Cardiologista"
                    placeholderTextColor="#999"
                    value={profession}
                    onChangeText={setProfession}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>CADASTRAR</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Já tem uma conta? </Text>
              <TouchableOpacity onPress={onBack}>
                <Text style={styles.loginLink}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modal de Sucesso */}
      <AlertModal
        visible={successModal}
        title="Sucesso! ✅"
        message="Cadastro realizado! Verifique seu email para ativar a conta."
        type="success"
        onConfirm={() => {
          setSuccessModal(false);
          onSuccess(email);
        }}
      />
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  loginLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    marginLeft: 40,
  },
});

