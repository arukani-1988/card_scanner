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
  /\b(manager|director|ceo|cto|cfo|coo|cmo|founder|co-founder|partner|president|vice|vp|head|engineer|developer|consultant|executive|officer|owner|proprietor|lead|architect|designer|analyst|associate|sales|marketing|advisor|chairman|managing|doctor|advocate|principal|supervisor|specialist|coordinator|representative|manager|dealer|agent)\b/i;
const COMPANY_RE =
  /\b(pvt|private|ltd|limited|llp|inc|corp|corporation|co|company|industries|enterprises|enterprise|solutions|technologies|technology|systems|group|associates|traders|trading|textiles|services|exports|imports|infra|infotech|labs|studio|agency|consultants|constructions|builders|motors|engineering|works|foods|pharma|chemicals|hospital|clinic|bank|university|college|institute|school|stores|mart|hub)\b|&\s*(sons|co)\b/i;
const ADDRESS_RE =
  /\b(road|rd|street|st|floor|nagar|sector|plot|building|bldg|tower|complex|highway|near|opp|opposite|colony|society|estate|park|chowk|marg|lane|avenue|ave|block|phase|industrial|area|gujarat|maharashtra|delhi|karnataka|rajasthan|india|ahmedabad|gandhinagar|surat|vadodara|rajkot|mumbai|pune|bengaluru|bangalore|chennai|hyderabad|kolkata)\b|\b\d{6}\b/i;
const LABEL_ONLY_RE =
  /^(e-?mail|email|web|website|www|tel|telephone|phone|ph|mobile|mob|cell|fax|address|add|office|res|m|t|f|o|p|w|e)[\s:.\-]*$/i;
const LEADING_LABEL_RE =
  /^(e-?mail|email|web|website|tel|telephone|phone|ph|mobile|mob|cell|fax|address|add|office)\s*[:.\-]\s*/i;

function digitsOf(s: string): string {
  return s.replace(/\D/g, '');
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

export function parseCard(lines: string[], options: ParseOptions = {}): ParsedCard {
  const cc = options.defaultCountryCode ?? '91';
  const result: ParsedCard = { name: '', title: '', company: '', phones: [], emails: [], website: '', address: '' };

  const rest: string[] = [];
  const seenNumbers = new Set<string>();

  for (const original of lines.map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)) {
    let line = original;

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
      if (!result.website) result.website = u.replace(/[.,;]+$/, '');
    }
    line = line.replace(URL_RE, ' ');

    // Phones, each labelled by the text just before it
    let cursor = 0;
    let leftover = '';
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
    line = leftover;

    line = line
      .replace(LEADING_LABEL_RE, '')
      .replace(/[|•·]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!line || LABEL_ONLY_RE.test(line) || line.length < 2) continue;
    rest.push(line);
  }

  // Address: keyword lines, plus lines sitting between address lines
  const addressIdx = new Set<number>();
  rest.forEach((l, i) => {
    if (ADDRESS_RE.test(l) && !TITLE_RE.test(l)) addressIdx.add(i);
  });
  if (addressIdx.size > 1) {
    const sorted = Array.from(addressIdx).sort((a, b) => a - b);
    for (let i = sorted[0]; i <= sorted[sorted.length - 1]; i++) addressIdx.add(i);
  }
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
