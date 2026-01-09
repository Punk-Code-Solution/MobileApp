import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './src/services/api/auth.service';
import { isTokenValid } from './src/utils/token.util';
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

const TOKEN_KEY = '@telemedicina:token';
const USER_DATA_KEY = '@telemedicina:userData';

// Variável global para callback de logout (usado pelo interceptor do axios)
let globalLogoutCallback: (() => void) | null = null;

export const setGlobalLogoutCallback = (callback: () => void) => {
  globalLogoutCallback = callback;
};

export const getGlobalLogoutCallback = (): (() => void) | null => {
  return globalLogoutCallback;
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');
  const [registerEmail, setRegisterEmail] = useState('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Recuperar token e dados do usuário ao iniciar o app
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedToken, storedUserData] = await Promise.all([
          AsyncStorage.getItem(TOKEN_KEY),
          AsyncStorage.getItem(USER_DATA_KEY),
        ]);

        if (storedToken && storedUserData) {
          // Validar se o token não está expirado
          if (isTokenValid(storedToken)) {
            setToken(storedToken);
            setUserData(JSON.parse(storedUserData));
            console.log('Token e dados do usuário recuperados do AsyncStorage');
          } else {
            // Token expirado, remover do storage
            console.log('Token expirado, removendo do storage');
            await AsyncStorage.multiRemove([TOKEN_KEY, USER_DATA_KEY]);
          }
        }
      } catch (error) {
        console.error('Erro ao recuperar token do AsyncStorage:', error);
      } finally {
        setIsLoadingToken(false);
      }
    };

    loadStoredAuth();
  }, []);

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
      
      // Validar se o tipo de usuário selecionado corresponde ao tipo retornado pela API
      const userRole = response.user?.role;
      if (userRole && userRole !== role) {
        const roleName = role === 'PATIENT' ? 'Cliente' : 'Profissional';
        const actualRoleName = userRole === 'PATIENT' ? 'Cliente' : 'Profissional';
        Alert.alert(
          'Tipo de usuário incorreto',
          `Este usuário é do tipo ${actualRoleName}. Por favor, selecione "${actualRoleName}" na tela de login.`
        );
        return;
      }
      
      // Salvar token e dados do usuário no AsyncStorage
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_DATA_KEY, JSON.stringify(response.user)],
      ]);

      setToken(token);
      setUserData(response.user);
      console.log('Token e dados do usuário salvos no AsyncStorage');
    } catch (error: any) {
      console.error('Erro login:', error);
      const msg = error.response?.data?.message || error.message || 'Falha ao conectar ao servidor';
      Alert.alert('Erro', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Remover token e dados do usuário do AsyncStorage
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_DATA_KEY]);
    } catch (error) {
      console.error('Erro ao remover token do AsyncStorage:', error);
    }
    
    setToken(null);
    setUserData(null);
    setCurrentScreen('login');
  };

  // Configurar callback de logout global para uso no interceptor do axios
  useEffect(() => {
    setGlobalLogoutCallback(handleLogout);
    return () => {
      setGlobalLogoutCallback(null);
    };
  }, []);

  // Se ainda está mostrando splash ou carregando token, exibir splash screen
  if (showSplash || isLoadingToken) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

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
    return <HomeScreen token={token} onLogout={handleLogout} userRole={userData?.role} />;
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
