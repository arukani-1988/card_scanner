import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import type { RootStackParamList } from './src/types';
import { parseCardLink } from './src/links';
import { handleIncomingImage } from './src/incoming';
import { loadSettings } from './src/storage';
import { CardWatcher } from './modules/card-watcher';
import ScanScreen from './src/screens/ScanScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SavedScreen from './src/screens/SavedScreen';
import CardsScreen from './src/screens/CardsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.accent, text: colors.ink } };

export default function App() {
  useEffect(() => {
    // Keep the "new photo looks like a card" watcher registered (Android only).
    loadSettings().then((s) => {
      if (CardWatcher && s.photoDetection) CardWatcher.setPhotoDetection(true);
    });

    // Photo notification buttons open the app with a cardscanner:// link.
    const openLink = (url: string | null | undefined) => {
      const link = parseCardLink(url);
      if (link) handleIncomingImage(navigationRef, link.uri, link.action);
    };
    Linking.getInitialURL().then(openLink);
    const linkSub = Linking.addEventListener('url', (e) => openLink(e.url));

    // Photos sent to the app from the Share menu (Android only).
    const sharedAtStart = CardWatcher?.getInitialSharedImage();
    if (sharedAtStart) handleIncomingImage(navigationRef, sharedAtStart, 'review');
    const shareSub = CardWatcher?.addListener('onSharedImage', (e) => handleIncomingImage(navigationRef, e.uri, 'review'));

    return () => {
      linkSub.remove();
      shareSub?.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} theme={navTheme}>
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
