// Turns the lines of text read from a visiting card into structured contact details.
// Pure TypeScript with no native dependencies, so it is unit-tested on its own.

export type PhoneKind = 'mobile' | 'work' | 'home' | 'fax';

export interface ParsedPhone {
  kind: PhoneKind;
  number: string;
}

export interface ParsedCard {
  name: string;
  title: string;
  company: string;
  phones: ParsedPhone[];
  emails: string[];
  website: string;
  address: string;
  /** The text as read from the card, one line per entry. Shown on the review screen. */
  raw: string[];
}

export interface ParseOptions {
  /** Country code (digits only) added to bare 10-digit mobile numbers. Default India. */
  defaultCountryCode?: string;
}

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)*\.[A-Z]{2,}/gi;
const URL_RE =
  /\b(?:https?:\/\/)?(?:www\.[^\s,;|]+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|in|co\.in|net|org|io|biz|info|co|edu|gov|tech|app|shop)\b(?:\/[^\s,;|]*)?)/gi;
const PHONE_RE = /(?:\+|00)?\d[\d\s().\-]{6,}\d/g;

const TITLE_RE =
  /\b(manager|director|ceo|cto|cfo|coo|cmo|founder|co-founder|partner|president|vice|vp|head|engineer|developer|consultant|executive|officer|owner|proprietor|lead|architect|designer|analyst|associate|sales|marketing|advisor|chairman|managing|doctor|advocate|principal|supervisor|specialist|coordinator|representative|dealer|agent)\b/i;
const COMPANY_RE =
  /\b(pvt|private|ltd|limited|llp|inc|corp|corporation|co|company|industries|enterprises|enterprise|solutions|technologies|technology|systems|group|associates|traders|trading|textiles|services|exports|imports|infra|infotech|labs|studio|agency|consultants|constructions|builders|motors|engineering|works|foods|pharma|chemicals|hospital|clinic|bank|university|college|institute|school|stores|mart|hub)\b|&\s*(sons|co)\b/i;
const ADDRESS_RE =
  /\b(road|rd|street|st|floor|nagar|sector|plot|building|bldg|tower|complex|highway|near|opp|opposite|colony|society|estate|park|chowk|marg|lane|avenue|ave|block|phase|industrial|area|gujarat|maharashtra|delhi|karnataka|rajasthan|india|ahmedabad|gandhinagar|surat|vadodara|rajkot|mumbai|pune|bengaluru|bangalore|chennai|hyderabad|kolkata)\b|\b\d{6}\b/i;
const PIN_RE = /\b\d{6}\b/;
const LABEL_ONLY_RE =
  /^(e-?mail|email|web|website|www|tel|telephone|phone|ph|mobile|mob|cell|fax|address|add|office|res|m|t|f|o|p|w|e)[\s:.\-]*$/i;
const LEADING_LABEL_RE =
  /^(e-?mail|email|web|website|tel|telephone|phone|ph|mobile|mob|cell|fax|address|add|office)\s*[:.\-]\s*/i;
const ADDRESS_LABEL_RE =
  /^(regd\.?\s*office|registered\s*office|head\s*office|corporate\s*office|office\s*address|address|add|factory|works|office)\s*[:\-.]\s*/i;

function digitsOf(s: string): string {
  return s.replace(/\D/g, '');
}

/** Repairs spacing the text reader often adds inside emails and web addresses. */
export function normalizeLine(line: string): string {
  return line
    .replace(/\s*[(\[]\s*at\s*[)\]]\s*/gi, '@')
    .replace(/\s*@\s*/g, '@')
    .replace(
      /@\s*([A-Za-z0-9-]+)\s*[.,]\s*([A-Za-z]{2,6})(?:\s*\.\s*(in|uk|au|za|nz|jp|sg|ae))?\b/g,
      (_m, a: string, b: string, c?: string) => `@${a}.${b}${c ? '.' + c : ''}`,
    )
    .replace(/\bwww\s*[.,]\s*/gi, 'www.')
    .replace(/\b(https?)\s*:\s*\/\/\s*/gi, '$1://');
}

/** Returns the 10-digit national number if this looks like an Indian mobile, else null.
 *  Landlines with a 2-digit area code ("79 2640 1122") or a leading 0 are not mobiles. */
function mobileNational(raw: string, cc: string): string | null {
  const t = raw.trim();
  const hasPlus = t.startsWith('+') || t.startsWith('00');
  let digits = digitsOf(t);
  if (t.startsWith('00')) digits = digits.slice(2);
  let rest = t.replace(/^(\+|00)/, '').trim();
  let national = digits;
  if (digits.startsWith(cc) && (hasPlus || digits.length === cc.length + 10)) {
    national = digits.slice(cc.length);
    rest = rest.replace(new RegExp('^' + cc), '').trim();
  } else if (hasPlus) {
    return null;
  }
  if (national.length !== 10 || !/^[6-9]/.test(national)) return null;
  const firstGroup = rest.split(/[\s\-.()]+/).filter(Boolean)[0] ?? '';
  if (firstGroup.length === 2) return null;
  return national;
}

function detectKind(context: string, raw: string, cc: string): PhoneKind {
  const c = context.toLowerCase();
  if (/\bfax\b|\bf\s*[:.\-]\s*$|\bf\s*$/.test(c)) return 'fax';
  if (/\bmob(ile)?\b|\bcell\b|whats\s?app|\bmo\b|\bm\s*[:.\-]\s*$|\bm\s*$/.test(c)) return 'mobile';
  if (/\bres(idence)?\b|\bhome\b|\br\s*[:.\-]\s*$/.test(c)) return 'home';
  if (/\btel(ephone)?\b|\bph(one)?\b|\boffice\b|\bwork\b|\bboard\b|\bt\s*[:.\-]\s*$|\bo\s*[:.\-]\s*$/.test(c)) {
    return 'work';
  }
  return mobileNational(raw, cc) ? 'mobile' : 'work';
}

function formatPhone(raw: string, cc: string): string {
  const n = mobileNational(raw, cc);
  if (n) return `+${cc} ${n.slice(0, 5)} ${n.slice(5)}`;
  return raw.replace(/[^\d+\s\-()]/g, '').replace(/\s+/g, ' ').trim();
}

function looksLikeName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  if (TITLE_RE.test(line) || COMPANY_RE.test(line) || ADDRESS_RE.test(line)) return false;
  if (/[\d@/\\|]/.test(line)) return false;
  return words.every((w) => /^[A-Z][A-Za-z.'’-]*$/.test(w) || /^[A-Z]{1,3}\.?$/.test(w));
}

function titleCase(s: string): string {
  return s
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

interface Entry {
  text: string;
  labelled: boolean;
}

function selectAddress(entries: Entry[]): Set<number> {
  const set = new Set<number>();
  const text = entries.map((e) => e.text);
  const other = (l: string) => TITLE_RE.test(l) || COMPANY_RE.test(l) || looksLikeName(l);
  const addressy = (l: string) => ADDRESS_RE.test(l) || /\d/.test(l) || l.includes(',');

  // 1. Lines with address words or a pin code (a company name that merely contains a city does not count)
  text.forEach((l, i) => {
    if (ADDRESS_RE.test(l) && !TITLE_RE.test(l) && !(COMPANY_RE.test(l) && !/\d|,/.test(l))) set.add(i);
  });

  // 2. A pin code ends an address: take the lines just above it that still look like address lines
  text.forEach((l, p) => {
    if (!PIN_RE.test(l)) return;
    set.add(p);
    for (let i = p - 1; i >= 0 && p - i <= 3; i--) {
      const t = text[i];
      if (addressy(t) && !TITLE_RE.test(t) && !(COMPANY_RE.test(t) && !ADDRESS_RE.test(t))) set.add(i);
      else break;
    }
  });

  // 3. "Address:" / "Regd. Office:" labels start an address
  entries.forEach((e, i) => {
    if (!e.labelled) return;
    set.add(i);
    for (let j = i + 1; j < text.length && j <= i + 3; j++) {
      if (other(text[j])) break;
      set.add(j);
    }
  });

  // 4. Close small gaps between address lines (a locality line with no keywords)
  const sorted = Array.from(set).sort((a, b) => a - b);
  for (let k = 0; k + 1 < sorted.length; k++) {
    const a = sorted[k];
    const b = sorted[k + 1];
    if (b - a > 1 && b - a <= 3) {
      const gap = text.slice(a + 1, b);
      if (gap.every((g) => !other(g))) for (let i = a + 1; i < b; i++) set.add(i);
    }
  }
  return set;
}

export function parseCard(lines: string[], options: ParseOptions = {}): ParsedCard {
  const cc = options.defaultCountryCode ?? '91';
  const raw = lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const result: ParsedCard = { name: '', title: '', company: '', phones: [], emails: [], website: '', address: '', raw };

  const entries: Entry[] = [];
  const seenNumbers = new Set<string>();
  let pendingAddressLabel = false;

  for (const original of raw) {
    let line = normalizeLine(original);

    // Emails
    const emails = line.match(EMAIL_RE) ?? [];
    for (const e of emails) {
      const lower = e.toLowerCase();
      if (!result.emails.includes(lower)) result.emails.push(lower);
    }
    line = line.replace(EMAIL_RE, ' ');

    // Websites (after emails are removed so e-mail domains are not mistaken for sites)
    const urls = line.match(URL_RE) ?? [];
    for (const u of urls) {
      if (!result.website) result.website = u.replace(/[.,;)]+$/, '');
    }
    line = line.replace(URL_RE, ' ');

    // Phones, each labelled by the text just before it
    let cursor = 0;
    let leftover = '';
    let hadPhone = false;
    const matches = Array.from(line.matchAll(PHONE_RE));
    for (const m of matches) {
      const idx = m.index ?? 0;
      const digits = digitsOf(m[0]);
      const context = line.slice(cursor, idx);
      if (digits.length < 8 || digits.length > 15) {
        leftover += line.slice(cursor, idx + m[0].length);
        cursor = idx + m[0].length;
        continue;
      }
      hadPhone = true;
      const number = formatPhone(m[0], cc);
      const key = digitsOf(number);
      if (!seenNumbers.has(key)) {
        seenNumbers.add(key);
        result.phones.push({ kind: detectKind(context || line.slice(0, idx), m[0], cc), number });
      }
      leftover += ' ';
      cursor = idx + m[0].length;
    }
    leftover += line.slice(cursor);
    line = leftover.replace(/\s+/g, ' ').trim();

    let labelled = pendingAddressLabel;
    if (ADDRESS_LABEL_RE.test(line) || /^(address|add|regd\.?\s*office|registered\s*office|head\s*office|corporate\s*office)\s*[:\-.]?$/i.test(line)) {
      if (!hadPhone) labelled = true;
      line = line.replace(ADDRESS_LABEL_RE, '');
    }
    line = line
      .replace(LEADING_LABEL_RE, '')
      .replace(/[|•·]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!line || LABEL_ONLY_RE.test(line) || line.length < 2) {
      // A label on its own line ("Address:") applies to the next line
      if (labelled && !hadPhone) pendingAddressLabel = true;
      continue;
    }
    pendingAddressLabel = false;
    entries.push({ text: line, labelled });
  }

  const addressIdx = selectAddress(entries);
  const rest = entries.map((e) => e.text);
  result.address = rest.filter((_, i) => addressIdx.has(i)).join(', ');

  const remaining = rest.filter((_, i) => !addressIdx.has(i));

  const titleLine = remaining.find((l) => TITLE_RE.test(l) && !COMPANY_RE.test(l));
  if (titleLine) result.title = titleLine;

  const companyLine = remaining.find((l) => COMPANY_RE.test(l) && l !== titleLine);
  if (companyLine) result.company = companyLine;

  const nameLine = remaining.find((l) => l !== titleLine && l !== companyLine && looksLikeName(l));
  if (nameLine) result.name = nameLine;

  if (!result.company) {
    const other = remaining.find((l) => l !== titleLine && l !== nameLine);
    if (other) result.company = other;
  }

  if (!result.name && result.emails.length) {
    const local = result.emails[0].split('@')[0];
    if (/[._-]/.test(local)) result.name = titleCase(local);
  }

  return result;
}

/** Splits "Dr. Priya R. Mehta" into given and family names for the contacts database. */
export function splitName(full: string): { givenName: string; familyName: string } {
  const words = full.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { givenName: words[0] ?? '', familyName: '' };
  return { givenName: words.slice(0, -1).join(' '), familyName: words[words.length - 1] };
}
