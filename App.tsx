import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { AppKit } from '@reown/appkit-wagmi-react-native';
import { WalletProvider } from './src/contexts/WalletContext';
import { colors } from './src/styles/theme';
import { globalStyles } from './src/styles/globalStyles';
import { StyleSheet, View, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { wagmiConfig, queryClient, initializeAppKit } from './src/config/walletConnect';

export default function App() {
  useEffect(() => {
    // Ensure proper initialization on React Native
    if (Platform.OS !== 'web') {
      console.log('zkETHer App initialized on', Platform.OS);
      // Initialize AppKit
      initializeAppKit();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.safeArea}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <WalletProvider>
              <StatusBar style="light" backgroundColor={colors.background} />
              <View style={styles.container}>
                <AppNavigator />
                <AppKit />
              </View>
            </WalletProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
