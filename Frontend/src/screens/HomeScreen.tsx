import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { colors } from '../theme/colors';
import NewHomeScreen from './NewHomeScreen';
import MyAppointments from './MyAppointments';
import MessagesScreen from './MessagesScreen';
import ProfileScreen from './ProfileScreen';
import BottomNavigation from '../components/BottomNavigation';

interface HomeScreenProps {
  token: string;
  onLogout: () => void;
}

type TabType = 'home' | 'messages' | 'appointments' | 'profile';

export default function HomeScreen({ token, onLogout }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" />
      
      {activeTab === 'home' && <NewHomeScreen token={token} onLogout={onLogout} />}
      {activeTab === 'appointments' && <MyAppointments token={token} onNavigateToChat={handleNavigateToChat} />}
      {activeTab === 'messages' && (
        <MessagesScreen 
          token={token} 
          initialConversation={initialConversation}
          onConversationOpened={handleConversationOpened}
        />
      )}
      {activeTab === 'profile' && <ProfileScreen token={token} onLogout={onLogout} />}

      <BottomNavigation activeTab={activeTab} onTabPress={handleTabPress} />
    </SafeAreaView>
  );
}
