import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors } from '../theme/colors';

type TabType = 'home' | 'messages' | 'appointments' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
}

export default function BottomNavigation({
  activeTab,
  onTabPress,
}: BottomNavigationProps) {
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'home', label: 'INÍCIO', icon: '🏠' },
    { id: 'messages', label: 'MENSAGENS', icon: '💬' },
    { id: 'appointments', label: 'CONSULTAS', icon: '📋' },
    { id: 'profile', label: 'PERFIL', icon: '👤' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onTabPress(tab.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.icon}>{tab.icon}</Text>
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
  icon: {
    fontSize: 24,
    marginBottom: 4,
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

