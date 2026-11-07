import { Fields, getContactsAsync } from 'expo-contacts/legacy';

export interface ContactSummary {
  id: string;
  name: string;
  phones: string[];
  emails: string[];
}

/** Compares phone numbers by their last 10 digits so "+91 98765 43210" equals "098765-43210". */
export function phoneKey(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 7) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export function findDuplicate(
  existing: ContactSummary[],
  card: { phones: { number: string }[]; emails: string[] },
): ContactSummary | null {
  const phoneKeys = new Set(card.phones.map((p) => phoneKey(p.number)).filter(Boolean));
  const emailKeys = new Set(card.emails.map((e) => e.trim().toLowerCase()).filter(Boolean));
  if (!phoneKeys.size && !emailKeys.size) return null;

  for (const c of existing) {
    if (c.phones.some((p) => phoneKeys.has(phoneKey(p)))) return c;
    if (c.emails.some((e) => emailKeys.has(e.trim().toLowerCase()))) return c;
  }
  return null;
}

/** Reads every contact's name, numbers and emails in one call. Needs contacts permission. */
export async function loadContactSummaries(): Promise<ContactSummary[]> {
  const response = await getContactsAsync({ fields: [Fields.PhoneNumbers, Fields.Emails] });
  return response.data.map((c) => ({
    id: c.id ?? '',
    name: c.name ?? '',
    phones: (c.phoneNumbers ?? []).map((p) => p.number ?? p.digits ?? '').filter(Boolean),
    emails: (c.emails ?? []).map((e) => e.email ?? '').filter(Boolean),
  }));
}
