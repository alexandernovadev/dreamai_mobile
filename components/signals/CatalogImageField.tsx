import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import {
  ApiError,
  apiErrorMessage,
  uploadDreamImageToCloudinary,
  type CloudinaryUploadContext,
} from '@/services';
import { colors, radius, spacing, typography } from '@/theme';

type Props = {
  label?: string;
  value: string;
  onChange: (secureUrl: string) => void;
  /** Carpeta en Cloudinary (`characters` | `locations` | `objects`). */
  uploadContext: Exclude<CloudinaryUploadContext, 'dreams'>;
  hint?: string;
};

/**
 * Vista previa + galería → subida a Cloudinary + opción de pegar URL manual.
 */
export function CatalogImageField({
  label = 'Image',
  value,
  onChange,
  uploadContext,
  hint,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAndUpload = useCallback(async () => {
    setError(null);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Gallery access is required to choose a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      const url = await uploadDreamImageToCloudinary(
        result.assets[0],
        uploadContext,
      );
      onChange(url);
    } catch (e) {
      const msg = apiErrorMessage(e);
      setError(
        e instanceof ApiError && e.status === 0
          ? `${msg} (check network)`
          : msg,
      );
    } finally {
      setUploading(false);
    }
  }, [onChange, uploadContext]);

  const clear = useCallback(() => {
    setError(null);
    onChange('');
  }, [onChange]);

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}

      <View style={styles.previewRow}>
        <View style={styles.previewBox}>
          {value ? (
            <Image
              source={{ uri: value }}
              style={styles.previewImg}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="image-outline" size={40} color={colors.accentMuted} />
            </View>
          )}
          {uploading ? (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color={colors.accent} size="large" />
            </View>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose image from gallery"
            onPress={() => void pickAndUpload()}
            disabled={uploading}
            style={({ pressed }) => [
              styles.pickBtn,
              pressed && { opacity: 0.85 },
              uploading && styles.pickBtnDisabled,
            ]}
          >
            <Ionicons name="images-outline" size={20} color={colors.accent} />
            <Text style={styles.pickBtnText}>Choose photo</Text>
          </Pressable>
          {value ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove image"
              onPress={clear}
              disabled={uploading}
              style={({ pressed }) => [
                styles.clearBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.clearBtnText}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <Input
        label="Or paste image URL"
        value={value}
        onChangeText={onChange}
        maxLength={2048}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        hint={hint ?? 'After upload, the secure Cloudinary URL appears here.'}
      />
    </View>
  );
}

const PREVIEW = 112;

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: -spacing.xs,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  previewBox: {
    width: PREVIEW,
    height: PREVIEW,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.buttonBorder,
    backgroundColor: colors.surfaceMuted,
  },
  pickBtnDisabled: {
    opacity: 0.55,
  },
  pickBtnText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  clearBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  err: {
    fontSize: typography.sizes.sm,
    color: colors.danger,
  },
});
