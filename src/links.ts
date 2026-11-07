export type IncomingAction = 'save' | 'review';

export interface IncomingLink {
  uri: string;
  action: IncomingAction;
}

/** Reads links like cardscanner://card?action=save&uri=content%3A%2F%2F... sent by the photo notification. */
export function parseCardLink(url: string | null | undefined): IncomingLink | null {
  if (!url) return null;
  const m = url.match(/^cardscanner:\/\/card\?(.*)$/);
  if (!m) return null;
  const params: Record<string, string> = {};
  for (const pair of m[1].split('&')) {
    const i = pair.indexOf('=');
    if (i < 0) continue;
    try {
      params[decodeURIComponent(pair.slice(0, i))] = decodeURIComponent(pair.slice(i + 1));
    } catch {
      return null;
    }
  }
  if (!params.uri) return null;
  return { uri: params.uri, action: params.action === 'save' ? 'save' : 'review' };
}
