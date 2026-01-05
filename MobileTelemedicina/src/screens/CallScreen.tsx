import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { colors } from '../theme/colors';

interface Professional {
  id: string;
  professionalName: string;
  professionalAvatar?: string;
}

interface CallScreenProps {
  professional: Professional;
  onBack: () => void;
  onEndCall: () => void;
}

export default function CallScreen({ professional, onBack, onEndCall }: CallScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Chamada</Text>
        
        <View style={styles.avatarContainer}>
          <Image
            source={{
              uri:
                professional.professionalAvatar ||
                `https://ui-avatars.com/api/?background=90EE90&color=fff&size=256&name=${encodeURIComponent(
                  professional.professionalName
                )}`,
            }}
            style={styles.avatar}
          />
        </View>

        <Text style={styles.professionalName}>{professional.professionalName}</Text>
        <Text style={styles.callStatus}>Chamando...</Text>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={onEndCall}
          activeOpacity={0.8}
        >
          <Text style={styles.endCallIcon}>📞</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  avatarContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#90EE90',
    marginBottom: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  professionalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  callStatus: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 80,
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  endCallIcon: {
    fontSize: 32,
    transform: [{ rotate: '135deg' }],
  },
});

