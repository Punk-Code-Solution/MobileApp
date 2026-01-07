import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../theme/colors';

type TabType = 'home' | 'messages' | 'appointments' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  unreadMessagesCount?: number;
  userRole?: 'PATIENT' | 'PROFESSIONAL';
}

export default function BottomNavigation({
  activeTab,
  onTabPress,
  unreadMessagesCount = 0,
  userRole,
}: BottomNavigationProps) {
  const allTabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'INÍCIO', icon: '🏠' },
    { id: 'messages', label: 'MENSAGENS', icon: '💬' },
    { id: 'appointments', label: 'CONSULTAS', icon: '📋' },
    { id: 'profile', label: 'PERFIL', icon: '👤' },
  ];
  
  // Filtrar tabs: profissionais não veem a aba "home"
  const tabs = userRole === 'PROFESSIONAL' 
    ? allTabs.filter(tab => tab.id !== 'home')
    : allTabs;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{tab.icon}</Text>
            {tab.id === 'messages' && unreadMessagesCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.label, activeTab === tab.id && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.navigation.darkBlue,
    paddingVertical: 12,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.navigation.darkBlue,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.light,
    letterSpacing: 0.5,
  },
  labelActive: {
    fontWeight: '700',
  },
});

