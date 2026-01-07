import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../theme/colors';

interface EmailVerificationSuccessScreenProps {
  onBackToLogin: () => void;
}

export default function EmailVerificationSuccessScreen({
  onBackToLogin,
}: EmailVerificationSuccessScreenProps) {
  return (
    <LinearGradient
      colors={[colors.gradient.top, colors.gradient.bottom]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.content}>
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              Sua conta foi verificada com sucesso!
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={onBackToLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>VOLTAR PARA LOGIN</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.characterContainer}>
            <Text style={styles.character}>👍</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageBox: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 40,
  },
  messageText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.darkBlue,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.text.darkBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  characterContainer: {
    marginTop: 20,
  },
  character: {
    fontSize: 120,
  },
});

