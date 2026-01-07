import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import NewHomeScreen from './NewHomeScreen';
import MyAppointments from './MyAppointments';
import MessagesScreen from './MessagesScreen';
import ProfileScreen from './ProfileScreen';
import NotificationsScreen from './NotificationsScreen';
import BottomNavigation from '../components/BottomNavigation';
import { useUnreadCounts } from '../hooks/useUnreadCounts';

interface HomeScreenProps {
  token: string;
  onLogout: () => void;
  userRole?: 'PATIENT' | 'PROFESSIONAL';
}

type TabType = 'home' | 'messages' | 'appointments' | 'profile';
type OverlayType = 'notifications' | null;

export default function HomeScreen({ token, onLogout, userRole }: HomeScreenProps) {
  // Se for PROFESSIONAL, iniciar na tela de consultas; caso contrário, iniciar na tela home
  const initialTab: TabType = userRole === 'PROFESSIONAL' ? 'appointments' : 'home';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [initialConversation, setInitialConversation] = useState<{
    professionalId?: string;
    conversationId?: string;
    professionalName: string;
    professionalAvatar?: string;
  } | null>(null);
  
  // Buscar contadores de não lidas
  const { unreadCounts, refresh: refreshCounts } = useUnreadCounts(token);

  const handleTabPress = (tab: TabType) => {
    // Profissionais não podem acessar a aba "home", redirecionar para "appointments"
    if (userRole === 'PROFESSIONAL' && tab === 'home') {
      setActiveTab('appointments');
      return;
    }
    setActiveTab(tab);
  };

  const handleNavigateToChat = (conversationIdOrProfessionalId: string, professionalName: string, professionalAvatar?: string) => {
    // Se for UUID (conversationId), usar diretamente; senão é professionalId
    const isConversationId = conversationIdOrProfessionalId.length > 20; // UUIDs são mais longos
    setInitialConversation({ 
      professionalId: isConversationId ? '' : conversationIdOrProfessionalId,
      conversationId: isConversationId ? conversationIdOrProfessionalId : undefined,
      professionalName, 
      professionalAvatar 
    });
    setActiveTab('messages');
  };

  const handleConversationOpened = () => {
    setInitialConversation(null);
  };

  const handleShowNotifications = () => {
    setOverlay('notifications');
  };

  const handleCloseNotifications = () => {
    setOverlay(null);
    // Atualizar contadores ao fechar notificações
    refreshCounts();
  };

  // Overlay de notificações
  if (overlay === 'notifications') {
    return (
      <NotificationsScreen
        token={token}
        onBack={handleCloseNotifications}
        onNotificationsUpdated={refreshCounts}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      
      {activeTab === 'home' && userRole !== 'PROFESSIONAL' && (
        <NewHomeScreen 
          token={token} 
          onLogout={onLogout}
          onShowNotifications={handleShowNotifications}
          unreadNotificationsCount={unreadCounts.notifications}
        />
      )}
      {activeTab === 'appointments' && (
        <MyAppointments 
          token={token} 
          onNavigateToChat={handleNavigateToChat}
          onShowNotifications={handleShowNotifications}
          unreadNotificationsCount={unreadCounts.notifications}
        />
      )}
      {activeTab === 'messages' && (
        <MessagesScreen 
          token={token} 
          initialConversation={initialConversation}
          onConversationOpened={handleConversationOpened}
          onShowNotifications={handleShowNotifications}
          unreadNotificationsCount={unreadCounts.notifications}
          onConversationsUpdated={refreshCounts}
        />
      )}
      {activeTab === 'profile' && (
        <ProfileScreen 
          token={token} 
          onLogout={onLogout}
          onShowNotifications={handleShowNotifications}
          unreadNotificationsCount={unreadCounts.notifications}
        />
      )}

      <BottomNavigation 
        activeTab={activeTab} 
        onTabPress={handleTabPress}
        unreadMessagesCount={unreadCounts.messages}
        userRole={userRole}
      />
    </SafeAreaView>
  );
}
