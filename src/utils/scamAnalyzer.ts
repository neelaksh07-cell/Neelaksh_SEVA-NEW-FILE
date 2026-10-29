export type RiskBand = 'Lower concern' | 'Suspicious' | 'High concern';

export interface WarningSign {
  id: string;
  category: 'Urgency & Pressure' | 'Confidential Data / Payment' | 'Domain & Link Structure' | 'Impersonation Pattern' | 'QR / UPI Mechanism';
  title: string;
  explanation: string;
  matchedText?: string;
  severity: 'low' | 'medium' | 'high';
}

export interface UrlInspectionDetail {
  rawUrl: string;
  hostname: string;
  protocol: string;
  port?: string;
  isTrustedDomain: boolean;
  isShortener: boolean;
  isIpAddress: boolean;
  hasSuspiciousTld: boolean;
  hasLookalikeKeyword: boolean;
  hasEmbeddedAtSymbol: boolean;
  notes: string[];
}

export interface DomainMatchingOptions {
  trustedDomains?: readonly string[];
  allowSubdomains?: boolean;
}

export interface ScamAnalysisResult {
  riskBand: RiskBand;
  summary: string;
  uncertaintyNotice: string;
  reputationServiceNotice: string;
  warningSigns: WarningSign[];
  extractedUrls: UrlInspectionDetail[];
  safeNextSteps: string[];
  containsPotentialPii: boolean;
  piiWarning?: string;
  aiExplanation?: {
    available: boolean;
    source: 'gemini-server' | 'heuristic-only';
    plainLanguageBreakdown: string;
    keyTakeaway: string;
    note?: string;
  };
}

export interface UpiQrDetails {
  isUpiUri: boolean;
  payeeAddress?: string;
  payeeName?: string;
  amount?: string;
  transactionNote?: string;
  mode?: string;
}

export interface QrAnalysisResult {
  decodedText: string;
  payloadType: 'UPI Payment Request' | 'Website URL' | 'Plain Text / Other';
  riskBand: RiskBand;
  summary: string;
  upiDetails?: UpiQrDetails;
  urlAnalysis?: ScamAnalysisResult;
  warningSigns: WarningSign[];
  safeNextSteps: string[];
}

const SHORTENER_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'is.gd',
  'cutt.ly',
  'rb.gy',
  'shorturl.at',
  'ow.ly',
  'rebrand.ly',
]);

const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.click',
  '.buzz',
  '.loan',
  '.work',
  '.gq',
  '.tk',
  '.ml',
  '.cf',
  '.icu',
  '.vip',
  '.shop',
  '.online',
  '.site',
];

const LOOKALIKE_BRAND_KEYWORDS = [
  'sbi',
  'onlinesbi',
  'hdfc',
  'icici',
  'axis',
  'kotak',
  'pnb',
  'paytm',
  'phonepe',
  'gpay',
  'npci',
  'rbi',
  'cybercrime',
  'uidai',
  'aadhaar',
  'epfo',
  'indiapost',
  'bescom',
  'mseb',
  'tatapower',
  'airtel',
  'jio',
  'irctc',
  'incometax',
  'parivahan',
];

export const DEFAULT_TRUSTED_DOMAINS: readonly string[] = [
  'gov.in',
  'nic.in',
  'ac.in',
  'onlinesbi.sbi',
  'sbi.co.in',
  'hdfcbank.com',
  'icicibank.com',
  'axisbank.com',
  'npci.org.in',
  'cybercrime.gov.in',
  'rbi.org.in',
  'irctc.co.in',
  'indiapost.gov.in',
];

const DISALLOWED_PROSE_ABBREVIATIONS = new Set(['e.g', 'i.e', 'mr.s', 'dr.s']);

/**
 * Normalizes a DNS hostname or IPv4 address:
 * - Converts to lowercase
 * - Strips a single trailing root dot (`.`) if present
 * - Rejects leading dots, consecutive dots (`..`), invalid DNS label characters, or out-of-range IPv4 octets
 */
export function normalizeHostname(rawHostname: string): string | null {
  if (typeof rawHostname !== 'string') return null;
  const trimmed = rawHostname.trim().toLowerCase();
  if (!trimmed) return null;

  // Reject leading dots, consecutive dots, or multiple trailing dots
  if (trimmed.startsWith('.') || trimmed.includes('..')) {
    return null;
  }

  const withoutTrailingDot = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  if (!withoutTrailingDot || withoutTrailingDot.endsWith('.')) {
    return null;
  }

  // Check IPv4 address validity
  if (/^(\d+\.)+\d+$/.test(withoutTrailingDot)) {
    const parts = withoutTrailingDot.split('.');
    if (parts.length !== 4) return null;
    const octets = parts.map((p) => Number(p));
    if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
      return null;
    }
    return withoutTrailingDot;
  }

  const labels = withoutTrailingDot.split('.');
  if (labels.length < 2) return null;

  const dnsLabelRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
  for (const label of labels) {
    if (!dnsLabelRegex.test(label)) {
      return null;
    }
  }

  // Top-level domain (rightmost label) must be alphabetic (at least 2 chars) or punycode
  const tld = labels[labels.length - 1];
  if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(tld)) {
    return null;
  }

  return withoutTrailingDot;
}

/**
 * Strictly checks whether a candidate hostname matches a configured trusted domain allowlist.
 * - Matches only if the normalized hostname is an exact match (`hostname === trustedDomain`)
 *   or, when `allowSubdomains` is true (default), ends at a strict DNS label boundary (`hostname.endsWith('.' + trustedDomain)`).
 * - Never uses unanchored substring or suffix checks.
 */
export function isTrustedHostname(
  rawHostname: string,
  options?: DomainMatchingOptions
): boolean {
  const hostname = normalizeHostname(rawHostname);
  if (!hostname) return false;

  // Raw IPv4 addresses are never treated as trusted organisation domains
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return false;
  }

  const trustedDomains = options?.trustedDomains ?? DEFAULT_TRUSTED_DOMAINS;
  const allowSubdomains = options?.allowSubdomains ?? true;

  for (const rawEntry of trustedDomains) {
    if (typeof rawEntry !== 'string') continue;
    const cleanedEntry = rawEntry.trim().toLowerCase().replace(/^\.+/, '');
    const trusted = normalizeHostname(cleanedEntry);
    if (!trusted) continue;

    if (hostname === trusted) {
      return true;
    }
    if (allowSubdomains && hostname.endsWith(`.${trusted}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Safely parses and validates a single URL string using the standard URL API
 * without ever fetching, opening, or executing it.
 * Rejects malformed URLs and unsupported protocols (such as `javascript:`, `data:`, `file:`, `vbscript:`).
 */
export function inspectUrlCandidate(
  rawCandidate: string,
  options?: DomainMatchingOptions
): UrlInspectionDetail | null {
  if (typeof rawCandidate !== 'string') return null;
  const trimmed = rawCandidate.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;

  // Detect explicit scheme prefix (distinguishing scheme: from host:port)
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):(.*)$/);
  let hasExplicitHttpScheme = false;

  if (schemeMatch) {
    const schemeName = schemeMatch[1].toLowerCase();
    const rest = schemeMatch[2];
    if (schemeName === 'http' || schemeName === 'https') {
      // Must start with // followed by a non-slash authority character
      if (!/^\/\/[^/\s]/.test(rest)) {
        return null;
      }
      hasExplicitHttpScheme = true;
    } else {
      // Any other scheme (e.g. javascript:, data:, vbscript:, mailto:, file:, ftp:) is rejected
      return null;
    }
  } else {
    // No explicit scheme: reject protocol-relative URLs starting with // or leading slashes
    if (trimmed.startsWith('//') || trimmed.startsWith('/')) {
      return null;
    }
  }

  const urlToParse = hasExplicitHttpScheme ? trimmed : `http://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(urlToParse);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null;
  }

  // Verify the raw authority section does not contain invalid empty port or multiple colons without userinfo
  const authorityMatch = urlToParse.match(/^https?:\/\/([^/?#]+)/i);
  if (!authorityMatch) return null;
  const rawAuthority = authorityMatch[1];
  const hostPortPart = rawAuthority.includes('@')
    ? rawAuthority.slice(rawAuthority.lastIndexOf('@') + 1)
    : rawAuthority;

  // Reject empty port like "example.com:" or non-numeric port
  const colonIdx = hostPortPart.indexOf(':');
  if (colonIdx !== -1) {
    const portStr = hostPortPart.slice(colonIdx + 1);
    if (!/^\d{1,5}$/.test(portStr)) {
      return null;
    }
    const portNum = Number(portStr);
    if (portNum < 1 || portNum > 65535) {
      return null;
    }
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname || DISALLOWED_PROSE_ABBREVIATIONS.has(hostname)) {
    return null;
  }

  const hasUserInfo = Boolean(parsed.username || parsed.password || rawAuthority.includes('@'));
  // If there was no explicit http(s):// scheme and the token is just user@domain without a slash,
  // treat it as an email address in prose unless it has a path/query or deceptive brand username.
  if (!hasExplicitHttpScheme && hasUserInfo && !trimmed.includes('/')) {
    const decodedUser = decodeURIComponent(parsed.username).toLowerCase();
    const userImitatesDomainOrBrand =
      isTrustedHostname(decodedUser, options) ||
      LOOKALIKE_BRAND_KEYWORDS.some((b) => decodedUser.includes(b));
    if (!userImitatesDomainOrBrand) {
      return null;
    }
  }

  const protocol = hasExplicitHttpScheme ? parsed.protocol.toLowerCase() : 'unspecified';
  const isShortener = SHORTENER_DOMAINS.has(hostname);
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  const hasSuspiciousTld = SUSPICIOUS_TLDS.some(
    (tld) => hostname.endsWith(tld) && hostname.length > tld.length
  );
  const hasEmbeddedAtSymbol = hasUserInfo || trimmed.includes('@');

  const isTrustedDomain = isTrustedHostname(hostname, options);

  const trustedDomains = options?.trustedDomains ?? DEFAULT_TRUSTED_DOMAINS;
  const normalizedTrustedList = trustedDomains
    .map((d) => normalizeHostname(d.replace(/^\.+/, '')))
    .filter((d): d is string => Boolean(d));

  // Check if hostname, username, path, or query imitates a brand or trusted domain on an untrusted host
  const matchedBrandInHost =
    LOOKALIKE_BRAND_KEYWORDS.find((brand) => hostname.includes(brand)) ||
    normalizedTrustedList.find(
      (td) => hostname.includes(td) || hostname.includes(td.replace(/\./g, '-'))
    );
  const nonHostComponents = `${decodeURIComponent(parsed.username)} ${decodeURIComponent(parsed.pathname)} ${decodeURIComponent(parsed.search)}`.toLowerCase();
  const matchedTrustedInNonHost = normalizedTrustedList.find((td) => nonHostComponents.includes(td));
  const matchedBrandInNonHost = LOOKALIKE_BRAND_KEYWORDS.find((brand) =>
    new RegExp(`\\b${brand}\\b`, 'i').test(nonHostComponents)
  );

  const matchedBrand = matchedBrandInHost || matchedTrustedInNonHost || matchedBrandInNonHost;
  const hasLookalikeKeyword = Boolean(!isTrustedDomain && matchedBrand);

  const notes: string[] = [];
  if (protocol === 'http:') {
    notes.push('Uses unencrypted HTTP instead of HTTPS.');
  }
  if (parsed.port) {
    notes.push(`Uses custom network port :${parsed.port}.`);
  }
  if (isShortener) {
    notes.push('Uses a link shortener that hides the true destination domain.');
  }
  if (isIpAddress) {
    notes.push('Points directly to a numeric IP address instead of a named organisation domain.');
  }
  if (hasSuspiciousTld) {
    notes.push('Uses a low-cost or frequently abused domain extension (TLD) uncommon for official Indian banks or utilities.');
  }
  if (hasLookalikeKeyword && matchedBrand) {
    if (matchedBrandInHost) {
      notes.push(`Hostname "${hostname}" contains "${matchedBrandInHost}" but is not an official trusted domain.`);
    } else {
      notes.push(`URL path, query, or username references "${matchedBrand}", but the actual destination host is "${hostname}".`);
    }
  }
  if (hasEmbeddedAtSymbol) {
    notes.push('Contains an "@" symbol inside the link, which can trick browsers into ignoring everything before the "@" and routing to a different host.');
  }
  if (hostname.split('.').length >= 4 && !isTrustedDomain) {
    notes.push('Uses multiple nested subdomains to mimic a legitimate service.');
  }
  if (notes.length === 0) {
    notes.push(
      isTrustedDomain
        ? 'Domain matches the configured official allowlist at a strict DNS label boundary, though sender authenticity should still be verified independently.'
        : 'No obvious structural anomalies in the domain string itself, but unknown domains still warrant caution.'
    );
  }

  return {
    rawUrl: trimmed,
    hostname,
    protocol,
    ...(parsed.port ? { port: parsed.port } : {}),
    isTrustedDomain,
    isShortener,
    isIpAddress,
    hasSuspiciousTld,
    hasLookalikeKeyword,
    hasEmbeddedAtSymbol,
    notes,
  };
}

/**
 * Extracts URLs from arbitrary text without opening, fetching, or executing them.
 * Tokenizes by whitespace so that domains appearing only inside another URL's path,
 * query string, username, or inside an unsupported scheme (`javascript:`, `data:`)
 * are never falsely extracted as standalone destination hosts.
 */
export function extractUrlsWithoutOpening(
  input: string,
  options?: DomainMatchingOptions
): UrlInspectionDetail[] {
  if (!input || !input.trim()) return [];

  // Reject entire input if it starts with an executable/non-web URI scheme such as javascript: or data:
  const trimmedInput = input.trim();
  if (/^(?:javascript|data|vbscript|file|blob)\s*:/i.test(trimmedInput)) {
    return [];
  }

  const rawTokens = input.split(/\s+/);
  const seen = new Set<string>();
  const results: UrlInspectionDetail[] = [];
  let prevTokenWasBrokenSchemePrefix = false;

  for (const rawToken of rawTokens) {
    if (!rawToken) continue;

    // Strip surrounding quotes/parentheses/brackets and trailing sentence punctuation
    let candidate = rawToken
      .replace(/^['"`<(\[]+/, '')
      .replace(/['"`>)\],;:!?]+$/, '');

    // If the previous token was an incomplete scheme prefix broken by whitespace (e.g. "http://exa mple.com"),
    // skip the immediate trailing fragment so a space-broken malformed URL is rejected cleanly.
    if (prevTokenWasBrokenSchemePrefix) {
      prevTokenWasBrokenSchemePrefix = false;
      continue;
    }

    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^.]*$/.test(candidate)) {
      prevTokenWasBrokenSchemePrefix = true;
      continue;
    }

    // If the token ends with a period in prose:
    // Keep it if the candidate is a valid URL even with the trailing dot (inspectUrlCandidate normalizes trailing dots),
    // or strip trailing dots that follow a URL path/query (e.g. "http://192.168.1.50/verify.")
    if (candidate.endsWith('.')) {
      const slashAfterSchemeIdx = candidate.replace(/^https?:\/\//i, '').indexOf('/');
      if (slashAfterSchemeIdx !== -1) {
        candidate = candidate.replace(/\.+$/, '');
      }
    }

    if (!candidate || !candidate.includes('.')) continue;

    // Skip tokens that don't look like a URL or domain in free text
    const hasExplicitScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(candidate);
    if (!hasExplicitScheme) {
      // Must start with alphanumeric and contain at least one dot
      if (!/^[a-zA-Z0-9]/.test(candidate)) continue;
    }

    const detail = inspectUrlCandidate(candidate, options);
    if (!detail) continue;

    const dedupeKey = `${detail.protocol}//${detail.hostname}:${detail.port || ''}/${detail.rawUrl.toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    results.push(detail);
  }

  return results;
}

/**
 * Checks whether user-submitted text appears to contain unredacted personal data
 * such as 12-digit Aadhaar-like numbers, PAN numbers, card numbers, or OTPs.
 */
export function checkPiiPresence(input: string): { hasPii: boolean; warning?: string } {
  if (!input) return { hasPii: false };

  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/;
  const cardOrAadhaarRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}(?:[\s-]?\d{4})?\b/;

  if (panRegex.test(input) || cardOrAadhaarRegex.test(input)) {
    return {
      hasPii: true,
      warning:
        'Privacy Reminder: Your input includes a number pattern resembling a PAN, Aadhaar, or card number. Always redact personal numbers, OTPs, and account details before sharing or checking messages.',
    };
  }
  return { hasPii: false };
}

/**
 * Transparent rule-based heuristic analyzer for messages and URLs.
 */
export function analyzeScamContent(
  rawInput: string,
  options?: DomainMatchingOptions
): ScamAnalysisResult {
  const input = (rawInput || '').trim();
  const warningSigns: WarningSign[] = [];
  const extractedUrls = extractUrlsWithoutOpening(input, options);
  const piiCheck = checkPiiPresence(input);

  // Flag dangerous non-web schemes (javascript:, data:, vbscript:) if present in input
  const dangerousSchemeMatch = input.match(/\b(javascript|data|vbscript)\s*:[^\s]*/i);
  if (dangerousSchemeMatch) {
    warningSigns.push({
      id: 'url-dangerous-scheme',
      category: 'Domain & Link Structure',
      title: `Unsupported or executable URI scheme detected (${dangerousSchemeMatch[1].toLowerCase()}:)`,
      explanation:
        'Links starting with javascript:, data:, or vbscript: can execute code or render fabricated content in a browser rather than navigating to a legitimate website.',
      matchedText: dangerousSchemeMatch[0].slice(0, 80),
      severity: 'high',
    });
  }

  // 1. Urgency & High-Pressure Language
  const urgencyPatterns: Array<{ regex: RegExp; label: string }> = [
    {
      regex: /\b(tonight|within\s+\d+\s*(?:hours?|hrs?|minutes?|mins?)|immediately|urgent(?:ly)?|last\s+warning|final\s+notice)\b/i,
      label: 'Time-pressure deadline',
    },
    {
      regex: /\b(disconnect(?:ed)?|block(?:ed)?|suspend(?:ed)?|deactivat(?:ed|e)|freeze|frozen|terminated)\b/i,
      label: 'Threat of service disconnection or account freeze',
    },
    {
      regex: /\b(electricity\s+power|power\s+supply|sim\s+card|bank\s+account|pan\s+card|aadhaar)\b.*\b(disconnect|block|suspend|expire|deactivat)/i,
      label: 'Essential utility or identity suspension threat',
    },
  ];

  for (const item of urgencyPatterns) {
    const match = input.match(item.regex);
    if (match) {
      warningSigns.push({
        id: `urgency-${warningSigns.length + 1}`,
        category: 'Urgency & Pressure',
        title: item.label,
        explanation:
          'Scammers create artificial panic (such as threatening power disconnection tonight or immediate account suspension) so you act quickly without verifying through official channels.',
        matchedText: match[0],
        severity: 'high',
      });
      break;
    }
  }

  // 2. Requests for Confidential Data, Remote Access, or Payments
  const credentialPatterns: Array<{ regex: RegExp; title: string; explanation: string; severity: 'medium' | 'high' }> = [
    {
      regex: /\b(otp|one[\s-]?time[\s-]?password|upi\s*pin|mpin|atm\s*pin|cvv|netbanking\s*password|login\s*password)\b/i,
      title: 'Request or mention of OTP, PIN, or secret credentials',
      explanation:
        'Banks, UPI apps, and government agencies never ask you to share your OTP, UPI PIN, CVV, or password over calls, SMS, WhatsApp, or unknown forms.',
      severity: 'high',
    },
    {
      regex: /\b(anydesk|teamviewer|quicksupport|rustdesk|screen\s*shar(?:e|ing)|apk\s*download|\.apk\b)\b/i,
      title: 'Remote screen-sharing app or APK installation request',
      explanation:
        'Asking you to install AnyDesk, TeamViewer, QuickSupport, or an `.apk` file allows scammers to watch your screen, steal OTPs, and take control of your device.',
      severity: 'high',
    },
    {
      regex: /\b(registration\s+fee|processing\s+fee|security\s+deposit|customs\s+duty|clearance\s+charge|unlock\s+fee|scan\s+qr\s+to\s+receive|enter\s+pin\s+to\s+receive)\b/i,
      title: 'Advance fee or deceptive payment instruction',
      explanation:
        'Demanding an upfront fee to release a job offer, parcel, loan, or prize—or claiming you must enter a UPI PIN to receive money—is a classic payment trap.',
      severity: 'high',
    },
    {
      regex: /\b(update\s+(?:your\s+)?kyc|kyc\s+(?:verification|expired|pending|update)|pan\s+link)\b/i,
      title: 'Unsolicited KYC update prompt',
      explanation:
        'Fraudulent KYC messages imitate banks or wallets and direct users to fake forms or personal phone numbers.',
      severity: 'medium',
    },
  ];

  for (const item of credentialPatterns) {
    const match = input.match(item.regex);
    if (match) {
      warningSigns.push({
        id: `cred-${warningSigns.length + 1}`,
        category: 'Confidential Data / Payment',
        title: item.title,
        explanation: item.explanation,
        matchedText: match[0],
        severity: item.severity,
      });
    }
  }

  // 3. Impersonation, Digital Arrest, Lottery & Fake Support Numbers
  const impersonationPatterns: Array<{ regex: RegExp; title: string; explanation: string; severity: 'medium' | 'high' }> = [
    {
      regex: /\b(digital\s+arrest|cbi\s+officer|narcotics|customs\s+parcel|illegal\s+parcel|money\s+laundering\s+case|police\s+verification\s+on\s+video\s+call|skype\s+interrogation)\b/i,
      title: 'Law-enforcement / "Digital Arrest" intimidation pattern',
      explanation:
        'Indian law enforcement agencies (Police, CBI, Customs, ED, RBI) never conduct "digital arrests", video-call interrogations, or demand money transfers to "verify" or clear your name.',
      severity: 'high',
    },
    {
      regex: /\b(won\s+a?\s*(?:lottery|prize|cashback|reward)|congratulations!\s*you\s+have\s+won|part[\s-]?time\s+job.*(?:₹|rs\.?|inr)\s*\d+|earn\s+(?:₹|rs\.?)\s*\d+.*(?:daily|per\s+day)|telegram\s+task|youtube\s+like\s+and\s+earn)\b/i,
      title: 'Unrealistic reward, lottery, or task-scam lure',
      explanation:
        'Promises of guaranteed high daily income for simple online tasks (like rating hotels or liking videos) or surprise lottery winnings are used to lure victims into depositing money.',
      severity: 'high',
    },
    {
      regex: /\b(?:call|contact|whatsapp)\s+(?:our\s+)?(?:officer|helpline|customer\s+care|support|executive)?\s*(?:immediately\s+)?(?:at|on)?\s*(?:\+?91[\s-]?)?[6-9]\d{9}\b/i,
      title: 'Personal 10-digit mobile number given as official helpline',
      explanation:
        'Official banks and electricity boards use verified toll-free or institutional numbers on their official websites—not personal 10-digit mobile numbers inside urgent SMS messages.',
      severity: 'high',
    },
  ];

  for (const item of impersonationPatterns) {
    const match = input.match(item.regex);
    if (match) {
      warningSigns.push({
        id: `imp-${warningSigns.length + 1}`,
        category: 'Impersonation Pattern',
        title: item.title,
        explanation: item.explanation,
        matchedText: match[0],
        severity: item.severity,
      });
    }
  }

  // 4. Domain & Link Structure Signals
  for (const urlInfo of extractedUrls) {
    if (urlInfo.isShortener) {
      warningSigns.push({
        id: `url-short-${urlInfo.hostname}`,
        category: 'Domain & Link Structure',
        title: `Shortened URL hides true destination (${urlInfo.hostname})`,
        explanation:
          'Link shorteners mask where a link actually leads. Legitimate banks and utilities rarely use public link shorteners for critical account actions.',
        matchedText: urlInfo.rawUrl,
        severity: 'medium',
      });
    }
    if (urlInfo.hasLookalikeKeyword) {
      warningSigns.push({
        id: `url-lookalike-${urlInfo.hostname}`,
        category: 'Domain & Link Structure',
        title: `Possible lookalike / imitation domain (${urlInfo.hostname})`,
        explanation:
          'This URL references a well-known institution or trusted domain name, but its actual destination host is an unverified domain rather than the organisation’s official website.',
        matchedText: urlInfo.rawUrl,
        severity: 'high',
      });
    }
    if (urlInfo.hasSuspiciousTld) {
      warningSigns.push({
        id: `url-tld-${urlInfo.hostname}`,
        category: 'Domain & Link Structure',
        title: `Uncommon or high-risk domain extension (${urlInfo.hostname})`,
        explanation:
          'Extensions like .xyz, .top, .click, or .buzz are frequently registered in bulk for short-lived phishing campaigns.',
        matchedText: urlInfo.rawUrl,
        severity: 'high',
      });
    }
    if (urlInfo.isIpAddress || urlInfo.hasEmbeddedAtSymbol) {
      warningSigns.push({
        id: `url-anomaly-${urlInfo.hostname}`,
        category: 'Domain & Link Structure',
        title: `Deceptive URL formatting (${urlInfo.rawUrl})`,
        explanation:
          'Using raw IP addresses or "@" symbols inside links is a strong technical indicator of a deceptive web address.',
        matchedText: urlInfo.rawUrl,
        severity: 'high',
      });
    }
    if (urlInfo.protocol === 'http:') {
      warningSigns.push({
        id: `url-http-${urlInfo.hostname}`,
        category: 'Domain & Link Structure',
        title: `Unencrypted HTTP link (${urlInfo.hostname})`,
        explanation:
          'The link uses plain HTTP without transport encryption. Sensitive banking or utility portals never ask you to sign in over unencrypted HTTP.',
        matchedText: urlInfo.rawUrl,
        severity: 'medium',
      });
    }
  }

  // Determine Cautious Risk Band
  const highCount = warningSigns.filter((w) => w.severity === 'high').length;
  const mediumCount = warningSigns.filter((w) => w.severity === 'medium').length;

  let riskBand: RiskBand = 'Lower concern';
  if (highCount >= 2 || (highCount >= 1 && mediumCount >= 1)) {
    riskBand = 'High concern';
  } else if (highCount === 1 || mediumCount >= 1 || extractedUrls.length > 0) {
    riskBand = warningSigns.length > 0 ? 'Suspicious' : 'Lower concern';
  }

  let summary = '';
  if (riskBand === 'High concern') {
    summary =
      'Multiple high-risk warning signs were found in this content, such as urgent threats, requests for sensitive credentials/payments, or deceptive link patterns. Do not click any links, call numbers in the message, or share personal information.';
  } else if (riskBand === 'Suspicious') {
    summary =
      'This content contains one or more warning signs that deserve careful verification before you trust it. Scammers often blend routine-sounding notifications with subtle pressure or unfamiliar links.';
  } else {
    summary =
      'No obvious high-pressure phrases, credential requests, or deceptive domain structures were detected by our visible heuristic checks. However, absence of visible red flags does not guarantee that a message or link is safe.';
  }

  const safeNextSteps: string[] = [
    'Do not click links or call phone numbers provided directly inside an unexpected SMS, WhatsApp message, or email.',
    'Independently open the organisation’s official app or type its known official website address yourself to check your account status.',
    'Never share OTPs, UPI PINs, CVV numbers, or install screen-sharing apps (like AnyDesk or TeamViewer) at a caller’s request.',
  ];

  if (riskBand === 'High concern' || riskBand === 'Suspicious') {
    safeNextSteps.push(
      'If you suspect financial cyber fraud in India, report it immediately on the National Cyber Crime Reporting Portal (cybercrime.gov.in) or call the official helpline 1930.'
    );
  }

  return {
    riskBand,
    summary,
    uncertaintyNotice:
      'This tool provides educational guidance, not a guarantee of scam detection. A "Lower concern" result does not prove a message is safe, and a "High concern" result is based on visible patterns rather than live verification.',
    reputationServiceNotice:
      'Live domain reputation and threat-intelligence database lookups are unavailable in this prototype. Assessment is performed using transparent local pattern checks and optional AI-assisted language analysis without visiting or executing any submitted links.',
    warningSigns,
    extractedUrls,
    safeNextSteps,
    containsPotentialPii: piiCheck.hasPii,
    piiWarning: piiCheck.warning,
  };
}

/**
 * Inspects a decoded QR code string (such as a `upi://pay` URI or website URL)
 * without ever navigating to or executing the destination.
 */
export function analyzeQrPayload(decodedText: string): QrAnalysisResult {
  const trimmed = (decodedText || '').trim();
  const warningSigns: WarningSign[] = [];

  if (/^upi:\/\/pay/i.test(trimmed)) {
    let payeeAddress = '';
    let payeeName = '';
    let amount = '';
    let transactionNote = '';
    let mode = '';

    try {
      const queryIndex = trimmed.indexOf('?');
      const searchParams = new URLSearchParams(queryIndex >= 0 ? trimmed.slice(queryIndex + 1) : '');
      payeeAddress = searchParams.get('pa') || '';
      payeeName = searchParams.get('pn') || '';
      amount = searchParams.get('am') || '';
      transactionNote = searchParams.get('tn') || '';
      mode = searchParams.get('mode') || '';
    } catch {
      // Fallback if malformed query
    }

    warningSigns.push({
      id: 'qr-upi-outgoing',
      category: 'QR / UPI Mechanism',
      title: 'This QR code initiates an OUTGOING UPI payment from your account',
      explanation:
        'A "upi://pay" QR code is a payment instruction to SEND money to the payee (' +
        (payeeAddress || 'unspecified VPA') +
        '). In UPI, you NEVER need to scan a QR code or enter your UPI PIN to receive a refund, prize, or buyer payment.',
      matchedText: trimmed.slice(0, 80),
      severity: 'high',
    });

    if (amount) {
      warningSigns.push({
        id: 'qr-upi-amount',
        category: 'QR / UPI Mechanism',
        title: `Pre-filled payment deduction amount: ₹${amount}`,
        explanation: `Scanning this QR code automatically pre-fills ₹${amount} to be debited from your bank account once you enter your UPI PIN.`,
        matchedText: `am=${amount}`,
        severity: 'high',
      });
    }

    if (/refund|cashback|reward|receive|claim|prize|army|cisf|olx/i.test(transactionNote + ' ' + payeeName)) {
      warningSigns.push({
        id: 'qr-upi-deceptive-note',
        category: 'Impersonation Pattern',
        title: 'Deceptive "Receive / Cashback / Refund" wording inside payment QR',
        explanation:
          'The payee name or transaction note mentions receiving money, cashback, or a refund, even though scanning this QR code will actually deduct money from your account.',
        matchedText: transactionNote || payeeName,
        severity: 'high',
      });
    }

    return {
      decodedText: trimmed,
      payloadType: 'UPI Payment Request',
      riskBand: amount || warningSigns.length >= 2 ? 'High concern' : 'Suspicious',
      summary:
        'This QR code contains a UPI payment URI ("upi://pay"). If someone sent you this QR code claiming you will RECEIVE money by scanning it, stop immediately—scanning a UPI QR code and entering your PIN always sends money out of your account.',
      upiDetails: {
        isUpiUri: true,
        payeeAddress: payeeAddress || 'Not specified',
        payeeName: payeeName || 'Not specified',
        amount: amount ? `₹${amount}` : 'Open / User-entered',
        transactionNote: transactionNote || 'None',
        mode: mode || 'Standard',
      },
      warningSigns,
      safeNextSteps: [
        'Remember the golden rule of UPI: You NEVER scan a QR code or enter a UPI PIN to receive money.',
        'If a marketplace buyer, refund agent, or courier asks you to scan this QR code to "receive payment", decline and block the contact.',
        'Verify the payee Virtual Payment Address (VPA) carefully before authorizing any genuine merchant payment.',
      ],
    };
  }

  // Otherwise analyze as URL / text
  const textAnalysis = analyzeScamContent(trimmed);
  const isUrl = /^https?:\/\//i.test(trimmed) || textAnalysis.extractedUrls.length > 0;

  if (isUrl) {
    warningSigns.push({
      id: 'qr-hidden-url',
      category: 'QR / UPI Mechanism',
      title: 'QR code encodes an external website link',
      explanation:
        'QR codes pasted on public posters, parcels, or sent in messages can hide phishing URLs or direct APK downloads because you cannot see the domain before scanning.',
      matchedText: trimmed.slice(0, 80),
      severity: textAnalysis.riskBand === 'High concern' ? 'high' : 'medium',
    });
  }

  const combinedWarnings = [...warningSigns, ...textAnalysis.warningSigns];
  const highCount = combinedWarnings.filter((w) => w.severity === 'high').length;
  const riskBand: RiskBand =
    highCount >= 1
      ? 'High concern'
      : combinedWarnings.length >= 1
      ? 'Suspicious'
      : 'Lower concern';

  return {
    decodedText: trimmed,
    payloadType: isUrl ? 'Website URL' : 'Plain Text / Other',
    riskBand,
    summary: isUrl
      ? 'This QR code points to a web address. Inspect the full domain name below in plain text before deciding whether to visit it manually.'
      : 'This QR code contains plain text data rather than a direct web link or UPI payment URI.',
    urlAnalysis: textAnalysis,
    warningSigns: combinedWarnings,
    safeNextSteps: [
      'Never let a scanner app automatically open web links embedded in untrusted QR codes.',
      'Check whether the domain name exactly matches the official organisation before visiting.',
      'Never download `.apk` files or enter banking credentials on pages opened from a QR code.',
    ],
  };
}

export interface LessonProgressMap {
  completedLessonIds: string[];
  quizScores: Record<string, { score: number; total: number }>;
}

export function calculateProgressSummary(
  progress: LessonProgressMap,
  totalLessonsCount: number
): {
  completedCount: number;
  totalLessons: number;
  completionPercentage: number;
  totalQuizCorrect: number;
  totalQuizQuestionsAnswered: number;
  averageQuizPercentage: number;
} {
  const completedCount = progress.completedLessonIds.length;
  const completionPercentage =
    totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  let totalQuizCorrect = 0;
  let totalQuizQuestionsAnswered = 0;

  for (const entry of Object.values(progress.quizScores)) {
    totalQuizCorrect += entry.score;
    totalQuizQuestionsAnswered += entry.total;
  }

  const averageQuizPercentage =
    totalQuizQuestionsAnswered > 0
      ? Math.round((totalQuizCorrect / totalQuizQuestionsAnswered) * 100)
      : 0;

  return {
    completedCount,
    totalLessons: totalLessonsCount,
    completionPercentage,
    totalQuizCorrect,
    totalQuizQuestionsAnswered,
    averageQuizPercentage,
  };
}
