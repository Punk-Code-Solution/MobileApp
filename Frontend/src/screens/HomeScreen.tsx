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

interface HomeScreenProps {
  token: string;
  onLogout: () => void;
}

type TabType = 'home' | 'messages' | 'appointments' | 'profile';
type OverlayType = 'notifications' | null;

export default function HomeScreen({ token, onLogout }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [initialConversation, setInitialConversation] = useState<{
    professionalId: string;
    professionalName: string;
    professionalAvatar?: string;
  } | null>(null);

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleNavigateToChat = (professionalId: string, professionalName: string, professionalAvatar?: string) => {
    setInitialConversation({ professionalId, professionalName, professionalAvatar });
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
  };

  // Overlay de notificações
  if (overlay === 'notifications') {
    return (
      <NotificationsScreen
        token={token}
        onBack={handleCloseNotifications}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      
      {activeTab === 'home' && (
        <NewHomeScreen 
          token={token} 
          onLogout={onLogout}
          onShowNotifications={handleShowNotifications}
        />
      )}
      {activeTab === 'appointments' && (
        <MyAppointments 
          token={token} 
          onNavigateToChat={handleNavigateToChat}
          onShowNotifications={handleShowNotifications}
        />
      )}
      {activeTab === 'messages' && (
        <MessagesScreen 
          token={token} 
          initialConversation={initialConversation}
          onConversationOpened={handleConversationOpened}
          onShowNotifications={handleShowNotifications}
        />
      )}
      {activeTab === 'profile' && (
        <ProfileScreen 
          token={token} 
          onLogout={onLogout}
          onShowNotifications={handleShowNotifications}
        />
      )}

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}
