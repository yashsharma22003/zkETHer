import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize } from '../styles/theme';
import OnboardingFlow from '../components/OnboardingFlow';

const Tab = createBottomTabNavigator();

// Placeholder screens for navigation structure
const HomeScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Home Screen</Text>
    <Text style={styles.subText}>zkETHer Dashboard</Text>
  </View>
);

const WalletScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Wallet Screen</Text>
    <Text style={styles.subText}>Manage your zkETHer wallet</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.screenText}>Settings Screen</Text>
    <Text style={styles.subText}>App configuration</Text>
  </View>
);

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors['muted-foreground'],
          tabBarLabelStyle: {
            fontFamily: 'Courier New',
            fontSize: 12,
          },
          headerStyle: {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
          headerTitleStyle: {
            color: colors.foreground,
            fontFamily: 'Courier New',
            fontSize: fontSize.lg,
          },
        }}
      >
        <Tab.Screen 
          name="Onboarding" 
          component={OnboardingFlow}
          options={{
            tabBarLabel: 'Start',
            headerTitle: 'zkETHer Mobile',
          }}
        />
        <Tab.Screen 
          name="Home" 
          component={HomeScreen}
          options={{
            tabBarLabel: 'Home',
            headerTitle: 'Dashboard',
          }}
        />
        <Tab.Screen 
          name="Wallet" 
          component={WalletScreen}
          options={{
            tabBarLabel: 'Wallet',
            headerTitle: 'Wallet',
          }}
        />
        <Tab.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Settings',
            headerTitle: 'Settings',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  screenText: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: 'Courier New',
    marginBottom: 10,
  },
  subText: {
    fontSize: fontSize.base,
    color: colors['muted-foreground'],
    fontFamily: 'Courier New',
    textAlign: 'center',
  },
});

export default AppNavigator;
