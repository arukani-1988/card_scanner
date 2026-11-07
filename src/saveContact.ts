import { Alert } from 'react-native';
import * as Contacts from 'expo-contacts';
import { splitName, type ParsedPhone, type PhoneKind } from './parseCard';
import { splitAddress } from './address';
import { findDuplicate, loadContactSummaries, phoneKey, type ContactSummary } from './duplicates';
import { addCard } from './storage';

export interface ContactInput {
  name: string;
  title: string;
  company: string;
  phones: ParsedPhone[];
  emails: string[];
  website: string;
  address: string;
}

export type SaveOutcome = 'saved' | 'updated' | 'cancelled' | 'denied';

const PHONE_LABELS: Record<PhoneKind, string> = {
  mobile: 'mobile',
  work: 'work',
  home: 'home',
  fax: 'work fax',
};

function websiteWithScheme(url: string): string {
  const u = url.trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

function addressRecord(address: string) {
  const a = splitAddress(address);
  if (!a.street && !a.city && !a.state && !a.postcode) return null;
  return { label: 'work', street: a.street, city: a.city, state: a.state, postcode: a.postcode, country: a.country };
}

function askAboutDuplicate(existingName: string): Promise<'update' | 'new' | 'cancel'> {
  return new Promise((resolve) => {
    Alert.alert(
      'Already in your contacts',
      `${existingName || 'A contact'} has the same phone number or email.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
        { text: 'Save as new', onPress: () => resolve('new') },
        { text: 'Add to existing', onPress: () => resolve('update') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
}

async function createContact(input: ContactInput): Promise<void> {
  const { givenName, familyName } = splitName(input.name);
  const phones = input.phones.filter((p) => p.number.trim()).map((p) => ({ label: PHONE_LABELS[p.kind], number: p.number.trim() }));
  const emails = input.emails.filter((e) => e.trim()).map((e) => ({ label: 'work', address: e.trim() }));
  const site = websiteWithScheme(input.website);
  const address = addressRecord(input.address);

  await Contacts.Contact.create({
    givenName,
    familyName,
    company: input.company.trim() || undefined,
    jobTitle: input.title.trim() || undefined,
    phones,
    emails,
    urlAddresses: site ? [{ label: 'work', url: site }] : [],
    addresses: address ? [address] : [],
  });
}

/** Adds only the details the existing contact does not have yet. */
async function updateContact(match: ContactSummary, input: ContactInput): Promise<void> {
  const contact = new Contacts.Contact(match.id);

  const havePhones = new Set((await contact.getPhones()).map((p) => phoneKey(p.number ?? '')));
  for (const p of input.phones) {
    if (p.number.trim() && !havePhones.has(phoneKey(p.number))) {
      await contact.addPhone({ label: PHONE_LABELS[p.kind], number: p.number.trim() });
    }
  }

  const haveEmails = new Set((await contact.getEmails()).map((e) => (e.address ?? '').toLowerCase()));
  for (const e of input.emails) {
    if (e.trim() && !haveEmails.has(e.trim().toLowerCase())) {
      await contact.addEmail({ label: 'work', address: e.trim() });
    }
  }

  const site = websiteWithScheme(input.website);
  if (site && (await contact.getUrlAddresses()).length === 0) {
    await contact.addUrlAddress({ label: 'work', url: site });
  }

  const address = addressRecord(input.address);
  if (address && (await contact.getAddresses()).length === 0) {
    await contact.addAddress(address);
  }
}

/**
 * Saves the card to the phone's contacts, first checking for a contact with the same
 * phone number or email. Also records the card in the in-app list.
 */
export async function saveCard(input: ContactInput): Promise<SaveOutcome> {
  const permission = await Contacts.requestPermissionsAsync();
  if (!permission.granted) return 'denied';

  let duplicate: ContactSummary | null = null;
  try {
    duplicate = findDuplicate(await loadContactSummaries(), input);
  } catch {
    duplicate = null; // if the check itself fails, still allow saving
  }

  let outcome: SaveOutcome = 'saved';
  if (duplicate) {
    const choice = await askAboutDuplicate(duplicate.name);
    if (choice === 'cancel') return 'cancelled';
    if (choice === 'update') {
      await updateContact(duplicate, input);
      outcome = 'updated';
    } else {
      await createContact(input);
    }
  } else {
    await createContact(input);
  }

  await addCard({ ...input, id: String(Date.now()), savedAt: Date.now() });
  return outcome;
}
