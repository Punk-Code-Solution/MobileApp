import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Badge({
  label,
  variant = 'info',
  size = 'medium',
  style,
  textStyle,
}: BadgeProps) {
  const badgeStyle = [
    styles.badge,
    styles[variant],
    styles[size],
    style,
  ];

  const badgeTextStyle = [
    styles.badgeText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <View style={badgeStyle}>
      <Text style={badgeTextStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  small: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  success: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  warning: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  error: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  info: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  neutral: {
    backgroundColor: '#F5F5F5',
    borderColor: '#9E9E9E',
  },
  badgeText: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
  successText: {
    color: '#2E7D32',
  },
  warningText: {
    color: '#E65100',
  },
  errorText: {
    color: '#C62828',
  },
  infoText: {
    color: '#1565C0',
  },
  neutralText: {
    color: '#424242',
  },
});

