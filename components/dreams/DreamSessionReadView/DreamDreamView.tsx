import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useAnimatedRef } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import type { DreamSession } from '@/services';
import { DreamHeroImage } from './DreamHeroImage';
import { DreamMetaHeader } from './DreamMetaHeader';
import { DreamNarrative } from './DreamNarrative';
import { DreamKindSection } from './DreamKindSection';
import { DreamReflectionSection } from './DreamReflectionSection';
import { DreamAnalysisSection } from './DreamAnalysisSection';
import { DreamMetaFooter } from './DreamMetaFooter';
import { radius, spacing } from '@/theme';

type DreamDreamViewProps = {
  session: DreamSession;
};

export function DreamDreamView({ session }: DreamDreamViewProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const heroHeight = Math.max(280, Math.min(width * 0.92, 420));

  return (
    <Animated.ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.dreamScrollContent}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      <DreamHeroImage
        images={session.dreamImages}
        heroHeight={heroHeight}
        scrollRef={scrollRef}
      />

      <View style={styles.dreamCard}>
        <DreamMetaHeader session={session} />
        <DreamNarrative text={session.rawNarrative} />
        <DreamKindSection kinds={session.dreamKind} />
        <DreamReflectionSection
          userThought={session.userThought}
          aiSummarize={session.aiSummarize}
        />
        <DreamAnalysisSection
          lucidityLevel={session.analysis?.lucidityLevel}
          perspectives={session.analysis?.perspectives ?? []}
        />
        <DreamMetaFooter session={session} />
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  dreamScrollContent: {
    paddingBottom: spacing.xxxl,
  },
  dreamCard: {
    marginTop: -spacing.xl,
    padding: spacing.lg,
    gap: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 196, 0.18)',
    backgroundColor: 'rgba(8, 10, 18, 0.88)',
  },
});
