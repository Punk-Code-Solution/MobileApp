/**
 * @format
 */

import React from 'react';
import { AppRegistry, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import App from './App';
import { name as appName } from './app.json';
import { ErrorBoundary } from './src/components/ErrorBoundary';

function Root() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ErrorBoundary>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <App />
        </SafeAreaProvider>
      </ErrorBoundary>
    </View>
  );
}

AppRegistry.registerComponent(appName, () => Root);
