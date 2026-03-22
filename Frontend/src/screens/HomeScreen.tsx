import React, { useState, useRef } from 'react';
import { StatusBar, View } from 'react-native';
import { useHardwareBackPress } from '../hooks/useHardwareBackPress';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import NewHomeScreen from './NewHomeScreen';
import SearchScreen from './SearchScreen';
import MyAppointments from './MyAppointments';
import ProfessionalDashboardScreen from './ProfessionalDashboardScreen';
import ProfessionalClientsScreen from './ProfessionalClientsScreen';
import MessagesScreen from './MessagesScreen';
import ProfileScreen from './ProfileScreen';
import NotificationsScreen from './NotificationsScreen';
import BottomNavigation, { TabType } from '../components/BottomNavigation';
import { useUnreadCounts } from '../hooks/useUnreadCounts';

interface HomeScreenProps {
  token: string;
  onLogout: () => Promise<void>;
  userRole?: 'PATIENT' | 'PROFESSIONAL';
}

type OverlayType = 'notifications' | null;

export default function HomeScreen({ token, onLogout, userRole }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [initialConversation, setInitialConversation] = useState<{
    professionalId?: string;
    conversationId?: string;
    professionalName: string;
    professionalAvatar?: string;
  } | null>(null);

  const { unreadCounts, refresh: refreshCounts } = useUnreadCounts(token);

  const homeBackRef = useRef<() => boolean>(() => false);
  homeBackRef.current = () => {
    if (overlay === 'notifications') {
      setOverlay(null);
      refreshCounts();
      return true;
    }
    if (activeTab !== 'home') {
      setActiveTab('home');
      return true;
    }
    return false;
  };
  useHardwareBackPress(() => homeBackRef.current());

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleNavigateToChat = (
    conversationIdOrProfessionalId: string,
    professionalName: string,
    professionalAvatar?: string,
  ) => {
    const isConversationId = conversationIdOrProfessionalId.length > 20;
    setInitialConversation({
      professionalId: isConversationId ? '' : conversationIdOrProfessionalId,
      conversationId: isConversationId ? conversationIdOrProfessionalId : undefined,
      professionalName,
      professionalAvatar,
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
    refreshCounts();
  };

  if (overlay === 'notifications') {
    return (
      <NotificationsScreen
        token={token}
        onBack={handleCloseNotifications}
        onNotificationsUpdated={refreshCounts}
      />
    );
  }

  /** Fundo claro + status escuro (agenda paciente e profissional usam o mesmo layout claro). */
  const safeAreaWhite =
    (activeTab === 'home' && userRole !== 'PROFESSIONAL') ||
    activeTab === 'appointments' ||
    activeTab === 'search' ||
    (userRole === 'PROFESSIONAL' && activeTab === 'home');

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={{
        flex: 1,
        backgroundColor: safeAreaWhite ? '#FFFFFF' : colors.background,
      }}
    >
      <StatusBar barStyle={safeAreaWhite ? 'dark-content' : 'light-content'} />

      {activeTab === 'home' && userRole !== 'PROFESSIONAL' && (
        <View style={{ flex: 1 }}>
          <NewHomeScreen
            token={token}
            onLogout={onLogout}
            onShowNotifications={handleShowNotifications}
            unreadNotificationsCount={unreadCounts.notifications}
          />
        </View>
      )}

      {activeTab === 'home' && userRole === 'PROFESSIONAL' && (
        <View style={{ flex: 1 }}>
          <ProfessionalDashboardScreen
            token={token}
            onShowNotifications={handleShowNotifications}
            unreadNotificationsCount={unreadCounts.notifications}
          />
        </View>
      )}

      {activeTab === 'search' && userRole === 'PROFESSIONAL' && (
        <View style={{ flex: 1 }}>
          <ProfessionalClientsScreen
            token={token}
            onShowNotifications={handleShowNotifications}
            unreadNotificationsCount={unreadCounts.notifications}
          />
        </View>
      )}

      {activeTab === 'search' && userRole !== 'PROFESSIONAL' && (
        <View style={{ flex: 1 }}>
          <SearchScreen token={token} onBack={() => {}} showBackButton={false} />
        </View>
      )}

      {activeTab === 'appointments' && (
        <View style={{ flex: 1 }}>
          <MyAppointments
            token={token}
            userRole={userRole}
            onNavigateToChat={handleNavigateToChat}
            onShowNotifications={handleShowNotifications}
            unreadNotificationsCount={unreadCounts.notifications}
          />
        </View>
      )}

      {activeTab === 'messages' && (
        <View style={{ flex: 1 }}>
          <MessagesScreen
            token={token}
            initialConversation={initialConversation}
            onConversationOpened={handleConversationOpened}
            onShowNotifications={handleShowNotifications}
            unreadNotificationsCount={unreadCounts.notifications}
            onConversationsUpdated={refreshCounts}
          />
        </View>
      )}

      {activeTab === 'profile' && (
        <View style={{ flex: 1 }}>
          <ProfileScreen
            onLogout={onLogout}
            onShowNotifications={handleShowNotifications}
            unreadNotificationsCount={unreadCounts.notifications}
          />
        </View>
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
