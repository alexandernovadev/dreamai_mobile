import { Stack } from 'expo-router';

/** /signals → hub; /signals/:entity → list; /signals/:entity/:id → detail; …/edit */
export default function SignalsStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
