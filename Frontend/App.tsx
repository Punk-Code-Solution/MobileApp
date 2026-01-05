import React, { useState } from 'react';
import { Alert } from 'react-native';
import { authService } from './src/services/api/auth.service';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import PasswordResetSuccessScreen from './src/screens/PasswordResetSuccessScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import EmailVerificationSuccessScreen from './src/screens/EmailVerificationSuccessScreen';

type AuthScreen = 'login' | 'register' | 'emailVerification' | 'emailVerificationSuccess' | 'forgotPassword' | 'resetPassword' | 'resetSuccess';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [registerEmail, setRegisterEmail] = useState('');

  // Se ainda está mostrando splash, exibir splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Função para fazer Login
  const handleLogin = async (email: string, password: string, role: 'PATIENT' | 'PROFESSIONAL') => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });

      console.log('Login Sucesso - Response completa:', JSON.stringify(response, null, 2));
      
      // O authService já extrai os dados do TransformInterceptor
      const token = response.access_token;
      
      console.log('Token extraído:', token ? 'Token encontrado' : 'Token NÃO encontrado');
      
      if (!token) {
        console.error('Token não encontrado na resposta:', response);
        Alert.alert('Erro', 'Token de autenticação não recebido');
        return;
      }
      
      setToken(token);
      setUserData(response.user);
      console.log('Token definido no estado, navegando para HomeScreen...');
    } catch (error: any) {
      console.error('Erro login:', error);
      const msg = error.response?.data?.message || error.message || 'Falha ao conectar ao servidor';
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
    console.log('Token existe, renderizando HomeScreen. Token:', token.substring(0, 20) + '...');
    return <HomeScreen token={token} onLogout={handleLogout} />;
  }
  
  console.log('Sem token, renderizando tela de autenticação. currentScreen:', currentScreen);

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
