import React, { useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import PasswordResetSuccessScreen from './src/screens/PasswordResetSuccessScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import EmailVerificationSuccessScreen from './src/screens/EmailVerificationSuccessScreen';

// Para Emulador Android: 10.0.2.2
// Para iOS ou Dispositivo Físico: Use o IP da sua máquina (ex: 192.168.1.X)
const API_URL = 'http://10.0.2.2:3000';

type AuthScreen = 'login' | 'register' | 'emailVerification' | 'emailVerificationSuccess' | 'forgotPassword' | 'resetPassword' | 'resetSuccess';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [registerEmail, setRegisterEmail] = useState('');

  // Função para fazer Login
  const handleLogin = async (email: string, password: string, role: 'PATIENT' | 'PROFESSIONAL') => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: email,
        password: password,
      });

      console.log('Login Sucesso:', response.data);
      setToken(response.data.access_token);
      setUserData(response.data.user);
      setCurrentScreen('login');
    } catch (error: any) {
      console.error('Erro login:', error);
      const msg = error.response?.data?.message || 'Falha ao conectar ao servidor';
      Alert.alert('Erro', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUserData(null);
    setCurrentScreen('login');
  };

  // Navegação entre telas de autenticação
  const handleForgotPassword = () => {
    setCurrentScreen('forgotPassword');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleEmailSent = () => {
    setCurrentScreen('resetPassword');
  };

  const handleResetSuccess = () => {
    setCurrentScreen('resetSuccess');
  };

  const handleCreateAccount = () => {
    setCurrentScreen('register');
  };

  const handleRegisterSuccess = (email: string) => {
    setRegisterEmail(email);
    setCurrentScreen('emailVerification');
  };

  const handleVerificationSuccess = () => {
    setCurrentScreen('emailVerificationSuccess');
  };

  const handleResendCode = () => {
    // Lógica para reenviar código - pode ser implementada aqui
    console.log('Reenviando código para:', registerEmail);
  };

  // --- ECRÃ DE LOGADO (HomeScreen com navegação por tabs) ---
  if (token) {
    return <HomeScreen token={token} onLogout={handleLogout} />;
  }

  // --- TELAS DE AUTENTICAÇÃO ---
  switch (currentScreen) {
    case 'register':
      return (
        <RegisterScreen
          onBack={handleBackToLogin}
          onSuccess={() => handleRegisterSuccess(registerEmail)}
        />
      );

    case 'emailVerification':
      return (
        <EmailVerificationScreen
          email={registerEmail}
          onBack={handleBackToLogin}
          onSuccess={handleVerificationSuccess}
          onResendCode={handleResendCode}
        />
      );

    case 'emailVerificationSuccess':
      return (
        <EmailVerificationSuccessScreen onBackToLogin={handleBackToLogin} />
      );

    case 'forgotPassword':
      return (
        <ForgotPasswordScreen
          onBack={handleBackToLogin}
          onEmailSent={handleEmailSent}
        />
      );

    case 'resetPassword':
      return (
        <ResetPasswordScreen
          onBack={handleBackToLogin}
          onSuccess={handleResetSuccess}
        />
      );

    case 'resetSuccess':
      return (
        <PasswordResetSuccessScreen onBackToLogin={handleBackToLogin} />
      );

    case 'login':
    default:
      return (
        <LoginScreen
          onLogin={handleLogin}
          onForgotPassword={handleForgotPassword}
          onCreateAccount={handleCreateAccount}
          loading={loading}
        />
      );
  }
}
