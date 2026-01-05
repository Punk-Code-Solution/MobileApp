import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import ProfileOptionsScreen from './ProfileOptionsScreen';

interface ProfileScreenProps {
  token: string;
  onLogout: () => void;
}

type ScreenState = 'profile' | 'options';

export default function ProfileScreen({ token, onLogout }: ProfileScreenProps) {
  const [screenState, setScreenState] = useState<ScreenState>('profile');
  const [userName, setUserName] = useState('Usuário');

  // Se estiver na tela de opções, mostra ela
  if (screenState === 'options') {
    return (
      <ProfileOptionsScreen
        onBack={() => setScreenState('profile')}
        onLogout={onLogout}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Azul Escuro */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?background=9E9E9E&color=fff&size=128&name=${encodeURIComponent(
                    userName
                  )}`,
                }}
                style={styles.avatar}
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Olá, {userName}!</Text>
              <Text style={styles.subtitle}>Este é o seu perfil</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setScreenState('options')}
          activeOpacity={0.8}
        >
          <Text style={styles.editButtonText}>EDITAR PERFIL</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.navigation.darkBlue,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#9E9E9E',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 32,
    alignItems: 'center',
  },
  editButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});

