import { Stack } from 'expo-router';
import { setStatusBarHidden, StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiErrorModal } from '@/components/ApiErrorModal';
import 'react-native-reanimated';

export default function RootLayout() {
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync('#000000');
    setStatusBarHidden(true, 'fade');

    if (Platform.OS === 'android') {
      void NavigationBar.setVisibilityAsync('hidden');
    }
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <ApiErrorModal />
      <StatusBar hidden style="light" hideTransitionAnimation="fade" />
    </SafeAreaProvider>
  );
}
