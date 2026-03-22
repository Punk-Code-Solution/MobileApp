import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabType = 'home' | 'search' | 'appointments' | 'messages' | 'profile';

interface BottomNavigationProps {
  activeTab: TabType;
  onTabPress: (tab: TabType) => void;
  unreadMessagesCount?: number;
}

const NAVY = '#1A4A8E';
const INACTIVE = '#94A3B8';

const ALL_TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'home', label: 'Início', icon: '🏠' },
  { id: 'search', label: 'Buscar', icon: '🔍' },
  { id: 'appointments', label: 'Agendamentos', icon: '📅' },
  { id: 'messages', label: 'Mensagens', icon: '💬' },
  { id: 'profile', label: 'Perfil', icon: '👤' },
];

export default function BottomNavigation({
  activeTab,
  onTabPress,
  unreadMessagesCount = 0,
}: BottomNavigationProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'ios' ? 8 : 10);

  const tabs = ALL_TABS;

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: bottomPad,
          shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress(tab.id)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
          >
            <View style={styles.iconWrap}>
              <Text style={[styles.icon, { opacity: active ? 1 : 0.85 }]}>{tab.icon}</Text>
              {tab.id === 'messages' && unreadMessagesCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
  },
  iconWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  icon: {
    fontSize: 22,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  labelActive: {
    color: NAVY,
    fontWeight: '800',
  },
  labelInactive: {
    color: INACTIVE,
    fontWeight: '600',
  },
});
