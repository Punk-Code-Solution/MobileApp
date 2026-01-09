import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors } from '../theme/colors';
import Button from './Button';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: AlertType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

export default function AlertModal({
  visible,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  showCancel = false,
}: AlertModalProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✓',
          iconColor: colors.success,
          iconBackground: '#E8F5E9',
        };
      case 'error':
        return {
          icon: '✕',
          iconColor: colors.error,
          iconBackground: '#FFEBEE',
        };
      case 'warning':
        return {
          icon: '⚠',
          iconColor: colors.warning,
          iconBackground: '#FFF3E0',
        };
      case 'info':
        return {
          icon: 'ℹ',
          iconColor: colors.primary,
          iconBackground: '#E3F2FD',
        };
      default:
        return {
          icon: 'ℹ',
          iconColor: colors.primary,
          iconBackground: '#E3F2FD',
        };
    }
  };

  const typeStyles = getTypeStyles();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: typeStyles.iconBackground }]}>
                <Text style={[styles.icon, { color: typeStyles.iconColor }]}>
                  {typeStyles.icon}
                </Text>
              </View>

              {/* Title */}
              <Text style={styles.title}>{title}</Text>

              {/* Message */}
              <Text style={styles.message}>{message}</Text>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                {showCancel && (
                  <View style={styles.buttonWrapper}>
                    <Button
                      title={cancelText}
                      onPress={handleCancel}
                      variant="outline"
                      fullWidth={true}
                    />
                  </View>
                )}
                <View style={styles.buttonWrapper}>
                  <Button
                    title={confirmText}
                    onPress={handleConfirm}
                    variant={type === 'error' ? 'danger' : 'primary'}
                    fullWidth={true}
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  buttonWrapper: {
    flex: 1,
  },
});

