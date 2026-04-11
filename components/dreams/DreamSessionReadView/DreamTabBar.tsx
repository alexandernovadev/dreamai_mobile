import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "@/theme";

export type DreamTab = "dream" | "elements";

type DreamTabBarProps = {
  activeTab: DreamTab;
  onTabPress: (tab: DreamTab) => void;
};

export function DreamTabBar({ activeTab, onTabPress }: DreamTabBarProps) {
  return (
    <View style={styles.tabRow}>
      {(["dream", "elements"] as const).map((tab) => {
        const isActive = activeTab === tab;
        const icon = tab === "dream" ? "book-outline" : "pricetags-outline";
        const label = tab === "dream" ? "Sueño" : "Elementos";

        return (
          <Pressable
            key={tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabPress(tab)}
            style={({ pressed }) => [
              styles.tabBtn,
              isActive ? styles.tabBtnOn : styles.tabBtnOff,
              pressed && { opacity: 0.88 },
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={isActive ? colors.text : colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelOn : styles.tabLabelOff,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tabBtnOn: {
    borderColor: "rgba(124, 92, 196, 0.45)",
    backgroundColor: "rgba(124, 92, 196, 0.2)",
  },
  tabBtnOff: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  tabLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  tabLabelOn: { color: colors.text },
  tabLabelOff: { color: colors.textMuted },
});
