import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type Settings } from '../storage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  function update(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.group}>
        <View style={[styles.row, styles.rowBorder]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.rowTitle}>Skip review, save directly</Text>
            <Text style={styles.rowBody}>Off by default, so you can check details before they are saved.</Text>
          </View>
          <Switch
            accessibilityLabel="Skip review, save directly"
            value={settings.skipReview}
            onValueChange={(v) => update({ skipReview: v })}
            trackColor={{ false: colors.switchOff, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.rowTitle}>Default country code</Text>
            <Text style={styles.rowBody}>Added to 10-digit mobile numbers that have no country code.</Text>
          </View>
          <View style={styles.codeWrap}>
            <Text style={styles.plus}>+</Text>
            <TextInput
              accessibilityLabel="Default country code"
              value={settings.countryCode}
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={(t) => update({ countryCode: t.replace(/\D/g, '') })}
              style={styles.code}
            />
          </View>
        </View>
      </View>

      <Text style={styles.note}>Card photos are read on your phone and are not uploaded anywhere.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 24 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.ink, marginTop: 4 },
  group: { marginTop: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rowBody: { fontSize: 13, lineHeight: 18, color: colors.muted },
  codeWrap: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  plus: { fontSize: 16, color: colors.muted },
  code: { width: 56, height: 44, borderWidth: 1, borderColor: colors.inputBorder, borderRadius: radius.input, textAlign: 'center', fontSize: 16, color: colors.ink, backgroundColor: colors.surface },
  note: { marginTop: 16, marginHorizontal: 4, fontSize: 13, lineHeight: 19, color: colors.muted },
});
