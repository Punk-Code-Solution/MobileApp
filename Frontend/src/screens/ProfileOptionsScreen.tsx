import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import AboutScreen from './AboutScreen';

interface ProfileOptionsScreenProps {
  onBack: () => void;
}

export default function ProfileOptionsScreen({
  onBack,
}: ProfileOptionsScreenProps) {
  const [showAbout, setShowAbout] = useState(false);

  const handleSettings = () => {
    Alert.alert('Configurações', 'Funcionalidade de configurações será implementada em breve.');
  };

  const handleContact = () => {
    Alert.alert('Contato', 'Funcionalidade de contato será implementada em breve.');
  };

  const handleHelp = () => {
    Alert.alert('Ajuda e Suporte', 'Funcionalidade de ajuda será implementada em breve.');
  };

  const handleAbout = () => {
    setShowAbout(true);
  };

  if (showAbout) {
    return <AboutScreen onBack={() => setShowAbout(false)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header Azul Escuro */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botões de Opções */}
        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Configurações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleContact}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Contato</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleHelp}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Ajuda e Suporte</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={handleAbout}
          activeOpacity={0.7}
        >
          <Text style={styles.optionText}>Sobre o App</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 12,
    backgroundColor: colors.navigation.darkBlue,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
});

