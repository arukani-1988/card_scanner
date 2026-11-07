import React, { useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radius } from '../theme';
import { Field, PrimaryButton, TextLink } from '../components/Ui';
import { saveCard } from '../saveContact';
import { savedParams } from '../incoming';
import type { PhoneKind } from '../parseCard';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Review'>;

const KINDS: PhoneKind[] = ['mobile', 'work', 'home', 'fax'];
const KIND_LABEL: Record<PhoneKind, string> = { mobile: 'Mobile', work: 'Work', home: 'Home', fax: 'Fax' };

export default function ReviewScreen({ navigation, route }: Props) {
  const initial = route.params.card;
  const [name, setName] = useState(initial.name);
  const [title, setTitle] = useState(initial.title);
  const [company, setCompany] = useState(initial.company);
  const [phones, setPhones] = useState(initial.phones.length ? initial.phones : [{ kind: 'mobile' as PhoneKind, number: '' }]);
  const [emails, setEmails] = useState(initial.emails.length ? initial.emails : ['']);
  const [website, setWebsite] = useState(initial.website);
  const [address, setAddress] = useState(initial.address);
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const found =
    [initial.name, initial.title, initial.company, initial.website, initial.address].filter(Boolean).length + initial.phones.length + initial.emails.length;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.retake}>
          <Text style={styles.retakeText}>Retake</Text>
        </Pressable>
      ),
    });
  }, [navigation]);

  function cycleKind(i: number) {
    setPhones((prev) => prev.map((p, idx) => (idx === i ? { ...p, kind: KINDS[(KINDS.indexOf(p.kind) + 1) % KINDS.length] } : p)));
  }

  async function save() {
    const cleanPhones = phones.filter((p) => p.number.trim());
    const cleanEmails = emails.map((e) => e.trim()).filter(Boolean);
    if (!name.trim() && !cleanPhones.length && !cleanEmails.length) {
      Alert.alert('Nothing to save', 'Add at least a name, a phone number or an email.');
      return;
    }
    setSaving(true);
    try {
      const input = { name: name.trim(), title: title.trim(), company: company.trim(), phones: cleanPhones, emails: cleanEmails, website: website.trim(), address: address.trim() };
      const outcome = await saveCard(input);
      if (outcome === 'denied') {
        Alert.alert('Contacts permission needed', 'Allow access to contacts in your phone settings so cards can be saved.');
        return;
      }
      if (outcome === 'cancelled') return;
      navigation.replace('Saved', savedParams(input));
    } catch {
      Alert.alert('Could not save', 'Something went wrong while saving the contact. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Card scanned</Text>
            <Text style={styles.bannerBody}>{found} details found. Tap any field to edit.</Text>
          </View>

          <Pressable accessibilityRole="button" onPress={() => setShowRaw((v) => !v)} style={styles.rawToggle}>
            <Text style={styles.rawToggleText}>{showRaw ? 'Hide scanned text' : 'Show scanned text'}</Text>
          </Pressable>
          {showRaw && (
            <View style={styles.rawBox}>
              <Text selectable style={styles.rawText}>{initial.raw.join('\n') || 'No text was read.'}</Text>
            </View>
          )}

          <View style={styles.form}>
            <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
            <Field label="Job title" value={title} onChangeText={setTitle} autoCapitalize="words" />
            <Field label="Company" value={company} onChangeText={setCompany} autoCapitalize="words" />

            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={styles.label}>Phone numbers</Text>
              {phones.map((p, i) => (
                <View key={i} style={styles.row}>
                  <Pressable accessibilityRole="button" accessibilityLabel={`Phone type ${KIND_LABEL[p.kind]}. Tap to change`} onPress={() => cycleKind(i)} style={styles.kindChip}>
                    <Text style={styles.kindText}>{KIND_LABEL[p.kind]}</Text>
                  </Pressable>
                  <TextInput
                    accessibilityLabel={`Phone number ${i + 1}`}
                    style={[styles.input, { flex: 1 }]}
                    value={p.number}
                    keyboardType="phone-pad"
                    onChangeText={(t) => setPhones((prev) => prev.map((x, idx) => (idx === i ? { ...x, number: t } : x)))}
                  />
                  {phones.length > 1 && (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove phone number ${i + 1}`} onPress={() => setPhones((prev) => prev.filter((_, idx) => idx !== i))} style={styles.remove}>
                      <Ionicons name="close" size={20} color={colors.muted} />
                    </Pressable>
                  )}
                </View>
              ))}
              <TextLink label="+ Add number" onPress={() => setPhones((prev) => [...prev, { kind: 'mobile', number: '' }])} />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={styles.label}>Email</Text>
              {emails.map((e, i) => (
                <View key={i} style={styles.row}>
                  <TextInput
                    accessibilityLabel={`Email ${i + 1}`}
                    style={[styles.input, { flex: 1 }]}
                    value={e}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={(t) => setEmails((prev) => prev.map((x, idx) => (idx === i ? t : x)))}
                  />
                  {emails.length > 1 && (
                    <Pressable accessibilityRole="button" accessibilityLabel={`Remove email ${i + 1}`} onPress={() => setEmails((prev) => prev.filter((_, idx) => idx !== i))} style={styles.remove}>
                      <Ionicons name="close" size={20} color={colors.muted} />
                    </Pressable>
                  )}
                </View>
              ))}
              <TextLink label="+ Add email" onPress={() => setEmails((prev) => [...prev, ''])} />
            </View>

            <Field label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
            <Field label="Address" value={address} onChangeText={setAddress} multiline />
          </View>

          <View style={styles.footer}>
            <PrimaryButton label={saving ? 'Saving…' : 'Save to Contacts'} onPress={save} disabled={saving} />
            <Text style={styles.footnote}>Saves to your phone's contact list</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
  retake: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  retakeText: { color: colors.accent, fontSize: 15, fontWeight: '500' },
  banner: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 16, gap: 3 },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: colors.ink },
  bannerBody: { fontSize: 13, lineHeight: 18, color: colors.muted },
  form: { marginTop: 24, gap: 16 },
  label: { fontSize: 13, fontWeight: '500', color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  kindChip: { width: 84, height: 48, borderRadius: radius.input, borderWidth: 1, borderColor: colors.inputBorder, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  kindText: { fontSize: 15, color: colors.ink },
  remove: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  rawToggle: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  rawToggleText: { color: colors.accent, fontSize: 14, fontWeight: '500' },
  rawBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, padding: 12 },
  rawText: { fontSize: 13, lineHeight: 19, color: colors.muted },
  footer: { paddingTop: 24, gap: 12 },
  footnote: { textAlign: 'center', fontSize: 13, color: colors.muted },
});
