import { Alert } from 'react-native';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import { readCard } from './ocr';
import { loadSettings } from './storage';
import { saveCard, type ContactInput } from './saveContact';
import type { IncomingAction } from './links';
import type { RootStackParamList } from './types';

type Nav = NavigationContainerRefWithCurrent<RootStackParamList>;

export function savedParams(input: ContactInput): RootStackParamList['Saved'] {
  return {
    name: input.name,
    title: input.title,
    company: input.company,
    phones: input.phones.length,
    emails: input.emails.length,
    website: input.website ? 1 : 0,
    address: input.address ? 1 : 0,
  };
}

async function waitForNavigation(nav: Nav): Promise<boolean> {
  for (let i = 0; i < 50; i++) {
    if (nav.isReady()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

/**
 * Handles a card photo that arrived from outside the app: the "Business card detected"
 * notification, or the Share menu. Reads it and either saves it or opens the review screen.
 */
export async function handleIncomingImage(nav: Nav, uri: string, action: IncomingAction): Promise<void> {
  if (!(await waitForNavigation(nav))) return;
  try {
    const settings = await loadSettings();
    const card = await readCard(uri, settings.countryCode);
    if (!card) {
      Alert.alert('Could not read this card', 'The photo does not seem to contain readable text.');
      return;
    }
    const hasContact = !!card.name || card.phones.length > 0 || card.emails.length > 0;
    if (action === 'save' && hasContact) {
      const outcome = await saveCard(card);
      if (outcome === 'denied') {
        Alert.alert('Contacts permission needed', 'Allow access to contacts in your phone settings so cards can be saved.');
      } else if (outcome !== 'cancelled') {
        nav.navigate('Saved', savedParams(card));
      }
      return;
    }
    nav.navigate('Review', { card });
  } catch {
    Alert.alert('Something went wrong', 'The card could not be read. Please try again.');
  }
}
