import * as Contacts from 'expo-contacts';
import { splitName, type ParsedPhone, type PhoneKind } from './parseCard';

export interface ContactInput {
  name: string;
  title: string;
  company: string;
  phones: ParsedPhone[];
  emails: string[];
  website: string;
  address: string;
}

const PHONE_LABELS: Record<PhoneKind, string> = {
  mobile: 'mobile',
  work: 'work',
  home: 'home',
  fax: 'work fax',
};

function splitAddress(address: string): { street: string; postcode: string } {
  const m = address.match(/\b\d{6}\b/);
  const postcode = m ? m[0] : '';
  const street = address
    .replace(postcode, '')
    .replace(/\s+,/g, ',')
    .replace(/,\s*$/, '')
    .trim();
  return { street, postcode };
}

/** Saves the card to the phone's contact list. Returns false when permission is refused. */
export async function saveToContacts(input: ContactInput): Promise<boolean> {
  const permission = await Contacts.requestPermissionsAsync();
  if (!permission.granted) return false;

  const { givenName, familyName } = splitName(input.name);
  const phones = input.phones.filter((p) => p.number.trim()).map((p) => ({ label: PHONE_LABELS[p.kind], number: p.number.trim() }));
  const emails = input.emails.filter((e) => e.trim()).map((e) => ({ label: 'work', address: e.trim() }));
  const website = input.website.trim();
  const { street, postcode } = splitAddress(input.address);

  await Contacts.Contact.create({
    givenName,
    familyName,
    company: input.company.trim() || undefined,
    jobTitle: input.title.trim() || undefined,
    phones,
    emails,
    urlAddresses: website ? [{ label: 'work', url: website }] : [],
    addresses: street || postcode ? [{ label: 'work', street, postcode }] : [],
  });
  return true;
}
