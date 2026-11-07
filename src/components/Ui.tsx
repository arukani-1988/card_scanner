import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

export function PrimaryButton({ label, onPress, disabled, style }: { label: string; onPress: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primary, pressed && { opacity: 0.85 }, disabled && { opacity: 0.5 }, style]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.85 }]}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...input}
        style={[styles.input, input.multiline && { height: 96, paddingTop: 12, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export const inputStyle = () => styles.input;

const styles = StyleSheet.create({
  primary: { height: 54, borderRadius: radius.button, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  secondary: { height: 54, borderRadius: radius.button, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.ink, fontSize: 17, fontWeight: '600' },
  link: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  linkText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.muted },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.ink,
  },
});
