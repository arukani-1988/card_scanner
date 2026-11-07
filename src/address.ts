// Splits a one-line address into the separate fields the contacts database expects.

export interface SplitAddress {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

const STATES = [
  'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat', 'haryana',
  'himachal pradesh', 'jharkhand', 'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur',
  'meghalaya', 'mizoram', 'nagaland', 'odisha', 'orissa', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu',
  'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi', 'new delhi',
  'jammu and kashmir', 'ladakh', 'chandigarh', 'puducherry', 'dadra and nagar haveli', 'daman and diu',
];

const titleCase = (s: string) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

export function splitAddress(address: string): SplitAddress {
  const out: SplitAddress = { street: '', city: '', state: '', postcode: '', country: '' };
  let parts = address
    .split(/,|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length) return out;

  const pin = address.match(/\b\d{6}\b/);
  if (pin) out.postcode = pin[0];
  parts = parts.map((p) => p.replace(/\b\d{6}\b/, '').replace(/^[\s\-–]+|[\s\-–]+$/g, '')).filter(Boolean);

  if (parts.length && /^india$/i.test(parts[parts.length - 1])) {
    out.country = 'India';
    parts.pop();
  }

  const last = parts[parts.length - 1];
  if (last) {
    const lower = last.toLowerCase();
    // Longest state name first so "new delhi" wins over "delhi"
    const state = [...STATES].sort((a, b) => b.length - a.length).find((s) => lower === s || lower.endsWith(' ' + s));
    if (state) {
      out.state = titleCase(state);
      const cityPart = last.slice(0, last.length - state.length).trim();
      parts.pop();
      if (cityPart) parts.push(cityPart);
    }
  }

  if (parts.length > 1 || (parts.length === 1 && (out.state || out.postcode))) {
    out.city = parts.pop() ?? '';
  }
  out.street = parts.join(', ');
  return out;
}
