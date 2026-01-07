import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface Professional {
  id: string;
  professionalName: string;
  professionalAvatar?: string;
}

interface VideoScreenProps {
  professional: Professional;
  onBack: () => void;
  onEndCall: () => void;
}

export default function VideoScreen({ professional, onBack, onEndCall }: VideoScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <Text style={styles.title}>Video</Text>
        
        {/* Área de Vídeo */}
        <View style={styles.videoContainer}>
          <Image
            source={{
              uri:
                professional.professionalAvatar ||
                `https://ui-avatars.com/api/?background=4A90E2&color=fff&size=512&name=${encodeURIComponent(
                  professional.professionalName
                )}`,
            }}
            style={styles.videoImage}
            resizeMode="cover"
          />
          <View style={styles.overlay}>
            <Text style={styles.professionalName}>{professional.professionalName}</Text>
          </View>
        </View>

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
    marginBottom: 24,
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: '#1A1A1A',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  endCallIcon: {
    fontSize: 32,
    transform: [{ rotate: '135deg' }],
  },
});

