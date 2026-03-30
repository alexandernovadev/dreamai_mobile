import { Stack } from 'expo-router';

/** Full catalog lists per entity type (step 1: Coming soon stub). Avoids route clash with tab `/signals`. */
export default function EntityListStackLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
