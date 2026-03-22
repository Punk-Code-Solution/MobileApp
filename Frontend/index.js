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
    <View style={{ flex: 1, backgroundColor: '#0E4EA8' }}>
      <ErrorBoundary>
        <SafeAreaProvider style={{ flex: 1 }}>
          <App />
        </SafeAreaProvider>
      </ErrorBoundary>
    </View>
  );
}

AppRegistry.registerComponent(appName, () => Root);
