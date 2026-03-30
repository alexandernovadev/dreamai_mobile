import { useLocalSearchParams } from 'expo-router';
import { DreamEditorScreen } from '@/components/dreams/DreamEditorScreen';

export default function DreamEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Array.isArray(id) ? id[0] : id;
  if (!sessionId) {
    return null;
  }
  return <DreamEditorScreen mode="edit" initialSessionId={sessionId} />;
}
