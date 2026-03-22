import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Evita tela preta silenciosa quando algum filho lança erro no render.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Algo deu errado</Text>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.msg}>{this.state.message}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#1A1A2E',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  scroll: { paddingBottom: 40 },
  msg: {
    color: '#334155',
    fontSize: 14,
  },
});
