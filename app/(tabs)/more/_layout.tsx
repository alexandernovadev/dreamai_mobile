import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function MoreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.surface },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="alerts" options={{ title: 'Alerts' }} />
      <Stack.Screen name="totem" options={{ title: 'Totem' }} />
      <Stack.Screen name="audio-cues" options={{ title: 'Audio cues' }} />
      <Stack.Screen name="catalog" options={{ title: 'Catalog' }} />
    </Stack>
  );
}
