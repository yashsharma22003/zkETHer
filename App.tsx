import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import OnboardingFlow from './src/components/OnboardingFlow';
import { globalStyles } from './src/styles/globalStyles';
import { colors } from './src/styles/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={globalStyles.safeArea}>
        <StatusBar style="light" backgroundColor={colors.background} />
        <View style={styles.container}>
          <OnboardingFlow />
        </View>
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
