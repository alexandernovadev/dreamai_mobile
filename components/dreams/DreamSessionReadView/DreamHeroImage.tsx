import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  type AnimatedRef,
  interpolate,
  useAnimatedStyle,
  useScrollOffset,
} from "react-native-reanimated";
import { colors, radius, spacing, typography } from "@/theme";

type DreamHeroImageProps = {
  images: string[];
  heroHeight: number;
  scrollRef: AnimatedRef<Animated.ScrollView>;
};

export function DreamHeroImage({
  images,
  heroHeight,
  scrollRef,
}: DreamHeroImageProps) {
  const [heroImageIndex, setHeroImageIndex] = React.useState(0);
  const heroImageUri = images[heroImageIndex] ?? null;
  const hasMultipleImages = images.length > 1;

  const scrollOffset = useScrollOffset(scrollRef);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollOffset.value,
          [-heroHeight, 0, heroHeight],
          [-heroHeight / 2, 0, heroHeight * 0.7],
        ),
      },
      {
        scale: interpolate(
          scrollOffset.value,
          [-heroHeight, 0, heroHeight],
          [1.8, 1, 1],
        ),
      },
    ],
  }));

  React.useEffect(() => {
    setHeroImageIndex(0);
  }, [images.length]);

  function goPrevHeroImage() {
    if (!images.length) return;
    setHeroImageIndex((current) =>
      current === 0 ? images.length - 1 : current - 1,
    );
  }

  function goNextHeroImage() {
    if (!images.length) return;
    setHeroImageIndex((current) =>
      current === images.length - 1 ? 0 : current + 1,
    );
  }

  return (
    <Animated.View
      style={[
        styles.parallaxHeader,
        { height: heroHeight },
        headerAnimatedStyle,
      ]}
    >
      {heroImageUri ? (
        <>
          <Image
            source={{ uri: heroImageUri }}
            style={styles.heroBackdrop}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroShade} />
          <View style={styles.heroForeground}>
            <Image
              source={{ uri: heroImageUri }}
              style={styles.heroImage}
              contentFit="contain"
              transition={200}
            />
          </View>
          {hasMultipleImages ? (
            <View style={styles.heroCarouselControls}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Imagen anterior"
                onPress={goPrevHeroImage}
                style={({ pressed }) => [
                  styles.heroNavBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </Pressable>

              <View style={styles.heroCarouselMeta}>
                <Text style={styles.heroCarouselCount}>
                  {heroImageIndex + 1} / {images.length}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Imagen siguiente"
                onPress={goNextHeroImage}
                style={({ pressed }) => [
                  styles.heroNavBtn,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.text}
                />
              </Pressable>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.heroEmpty}>
          <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          <Text style={styles.heroEmptyText}>Sin imagen del sueño</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  parallaxHeader: {
    overflow: "hidden",
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.34,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(6, 8, 18, 0.42)",
  },
  heroForeground: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  heroCarouselControls: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  heroNavBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 92, 196, 0.42)",
    backgroundColor: "rgba(124, 92, 196, 0.28)",
  },
  heroCarouselMeta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(7, 8, 18, 0.55)",
  },
  heroCarouselCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  heroEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
