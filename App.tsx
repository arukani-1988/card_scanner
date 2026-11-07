import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/types';
import ScanScreen from './src/screens/ScanScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SavedScreen from './src/screens/SavedScreen';
import CardsScreen from './src/screens/CardsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.accent, text: colors.ink } };

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="Scan"
          screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.bg }, headerTitleStyle: { fontWeight: '600' }, headerBackButtonDisplayMode: 'minimal' }}
        >
          <Stack.Screen name="Scan" component={ScanScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Review details' }} />
          <Stack.Screen name="Saved" component={SavedScreen} options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="Cards" component={CardsScreen} options={{ title: '' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
