/**
 * Sistema de Telemedicina - Aplicativo Mobile
 * 
 * Copyright (c) 2025-2026 Punk Code Solution
 * CNPJ: 61.805.210/0001-41
 * Rua do Aconchego, Ilhéus - BA, CEP 45656-627
 * 
 * Este software é propriedade da Punk Code Solution e está protegido
 * pelas leis de direitos autorais brasileiras e internacionais.
 * Licenciado sob os termos da licença MIT.
 */

import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './src/services/api/auth.service';
import { isTokenValid } from './src/utils/token.util';
import { ToastProvider } from './src/hooks/useToast';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import PasswordResetSuccessScreen from './src/screens/PasswordResetSuccessScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import EmailVerificationSuccessScreen from './src/screens/EmailVerificationSuccessScreen';
import CompletePatientProfileScreen from './src/screens/CompletePatientProfileScreen';

type AuthScreen = 'login' | 'register' | 'emailVerification' | 'emailVerificationSuccess' | 'forgotPassword' | 'resetPassword' | 'resetSuccess' | 'completePatientProfile';

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
            const parsedUserData = JSON.parse(storedUserData);
            setToken(storedToken);
            setUserData(parsedUserData);
            // Verificar se paciente precisa completar perfil
            if (parsedUserData?.role === 'PATIENT' && parsedUserData?.hasCompleteProfile === false) {
              setCurrentScreen('completePatientProfile');
            }
          } else {
            // Token expirado, remover do storage
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

      // O authService já extrai os dados do TransformInterceptor
      const token = response.access_token;
      
      if (!token) {
        console.error('Token não encontrado na resposta');
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
      
      // Verificar se o paciente tem perfil completo
      const hasCompleteProfile = response.user?.hasCompleteProfile !== false;
      
      // Se for paciente e não tiver perfil completo, redirecionar para completar cadastro
      if (userRole === 'PATIENT' && !hasCompleteProfile) {
        // Salvar token temporariamente para usar na tela de completar cadastro
        await AsyncStorage.multiSet([
          [TOKEN_KEY, token],
          [USER_DATA_KEY, JSON.stringify(response.user)],
        ]);
        setToken(token);
        setUserData(response.user);
        setCurrentScreen('completePatientProfile');
        setLoading(false);
        return;
      }

      // Salvar token e dados do usuário no AsyncStorage
      await AsyncStorage.multiSet([
        [TOKEN_KEY, token],
        [USER_DATA_KEY, JSON.stringify(response.user)],
      ]);

      setToken(token);
      setUserData(response.user);
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
  };

  // --- ECRÃ DE LOGADO (HomeScreen com navegação por tabs) ---
  // Verificar se precisa completar perfil antes de mostrar HomeScreen
  if (token && currentScreen === 'completePatientProfile') {
    return (
      <ToastProvider>
        <CompletePatientProfileScreen
          token={token}
          onComplete={() => {
            // Após completar, atualizar userData e ir para HomeScreen
            if (userData) {
              const updatedUserData = { ...userData, hasCompleteProfile: true };
              AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUserData));
              setUserData(updatedUserData);
            }
            setCurrentScreen('login'); // Reset para forçar renderização do HomeScreen
            // O useEffect vai detectar o token e renderizar HomeScreen
          }}
        />
      </ToastProvider>
    );
  }

  if (token && userData?.hasCompleteProfile !== false) {
    return (
      <ToastProvider>
        <HomeScreen token={token} onLogout={handleLogout} userRole={userData?.role} />
      </ToastProvider>
    );
  }

  // --- TELAS DE AUTENTICAÇÃO ---
  const renderAuthScreen = () => {
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
  };

  return <ToastProvider>{renderAuthScreen()}</ToastProvider>;
}
