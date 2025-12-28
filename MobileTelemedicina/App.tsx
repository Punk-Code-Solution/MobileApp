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
  ScrollView,
} from 'react-native';
import axios from 'axios';
import DoctorsList from './src/DoctorsList';

// Para Emulador Android: 10.0.2.2
// Para iOS ou Dispositivo Físico: Use o IP da sua máquina (ex: 192.168.1.X)
const API_URL = 'http://10.0.2.2:3000';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  // Função para fazer Login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e palavra-passe');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        password: password,
      });

      console.log('Login Sucesso:', response.data);
      setToken(response.data.access_token);
      setUserData(response.data.user);
      Alert.alert('Sucesso', 'Login efetuado com sucesso!');
      
    } catch (error: any) {
      console.error('Erro login:', error);
      const msg = error.response?.data?.message || 'Falha ao conectar ao servidor';
      Alert.alert('Erro', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // Função para criar um utilizador de teste (para não precisar do Postman)
  const handleCreateTestUser = async () => {
    setLoading(true);
    const randomNum = Math.floor(Math.random() * 1000);
    const mockUser = {
      email: `paciente${randomNum}@teste.com`,
      password: '123456',
      role: 'PATIENT',
      fullName: `Paciente Teste ${randomNum}`,
      phone: '11999999999',
      cpf: `${randomNum}`.padStart(11, '0'), // Gera um CPF fake numérico
      birthDate: '1990-01-01T00:00:00Z'
    };

    try {
      await axios.post(`${API_URL}/users`, mockUser);
      Alert.alert('Conta Criada!', `Use:\nEmail: ${mockUser.email}\nSenha: 123456`);
      setEmail(mockUser.email);
      setPassword(mockUser.password);
    } catch (error: any) {
      console.error('Erro criar:', error);
      const msg = error.response?.data?.message || 'Erro ao criar conta';
      Alert.alert('Erro', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserData(null);
    setEmail('');
    setPassword('');
  };

  // --- ECRÃ DE LOGADO (Substitua o antigo if(token) por este) ---
  if (token) {
    return (
      <DoctorsList token={token} onLogout={handleLogout} />
    );
  }

  // --- ECRÃ DE LOGIN ---
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.form}>
          <Text style={styles.title}>Health Uber 🩺</Text>
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="email@exemplo.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.label}>Palavra-passe</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.helperText}>Não tem conta? (Modo Dev)</Text>
          <TouchableOpacity 
            style={styles.buttonOutline} 
            onPress={handleCreateTestUser}
            disabled={loading}
          >
            <Text style={styles.buttonTextOutline}>Criar Utilizador de Teste</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2F5' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  form: { backgroundColor: '#FFF', padding: 25, borderRadius: 15, elevation: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 16, marginBottom: 8, color: '#444', fontWeight: '600' },
  text: { fontSize: 16, color: '#333', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, marginBottom: 20, fontSize: 16, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#007BFF', padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 25 },
  helperText: { textAlign: 'center', color: '#888', marginBottom: 10 },
  buttonOutline: { borderWidth: 1, borderColor: '#007BFF', padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonTextOutline: { color: '#007BFF', fontSize: 16, fontWeight: '600' },
  buttonSecondary: { backgroundColor: '#FF3B30', padding: 15, borderRadius: 10, alignItems: 'center', width: '100%' },
  buttonTextSecondary: { color: '#FFF', fontWeight: 'bold' }
});