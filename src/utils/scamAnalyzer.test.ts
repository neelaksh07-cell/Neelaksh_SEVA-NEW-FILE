import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeScamContent,
  analyzeQrPayload,
  extractUrlsWithoutOpening,
  inspectUrlCandidate,
  isTrustedHostname,
  normalizeHostname,
  checkPiiPresence,
  calculateProgressSummary,
} from './scamAnalyzer';

test('flags urgent electricity bill disconnection scam with personal phone number and lookalike link as High concern', () => {
  const msg =
    'Dear Consumer, your Electricity power will be disconnected tonight at 9:30 PM from MSEB office because your previous month bill was not updated. Call immediately our officer at 9876543210 or update at http://mseb-bill-update.xyz/login';
  const result = analyzeScamContent(msg);

  assert.equal(result.riskBand, 'High concern');
  assert.ok(result.warningSigns.length >= 3);
  assert.equal(result.extractedUrls.length, 1);
  assert.equal(result.extractedUrls[0].hostname, 'mseb-bill-update.xyz');
  assert.equal(result.extractedUrls[0].isTrustedDomain, false);
  assert.equal(result.extractedUrls[0].hasSuspiciousTld, true);
  assert.equal(result.extractedUrls[0].hasLookalikeKeyword, true);
});

test('flags remote access screen-sharing and OTP request as High concern', () => {
  const msg =
    'SBI KYC Alert: Your account is suspended. Please download AnyDesk app and share your 6-digit OTP with customer support executive to reactivate.';
  const result = analyzeScamContent(msg);

  assert.equal(result.riskBand, 'High concern');
  const categories = result.warningSigns.map((w) => w.category);
  assert.ok(categories.includes('Confidential Data / Payment'));
});

test('rates benign conversational text without links or pressure as Lower concern while maintaining non-guarantee disclaimer', () => {
  const msg =
    'Hi Priya, the college seminar on cybersecurity starts at 11:00 AM tomorrow in Seminar Hall B. Bring your notebook.';
  const result = analyzeScamContent(msg);

  assert.equal(result.riskBand, 'Lower concern');
  assert.equal(result.extractedUrls.length, 0);
  assert.ok(result.uncertaintyNotice.includes('educational guidance'));
  assert.ok(result.reputationServiceNotice.includes('unavailable'));
});

test('analyzes UPI QR code payment URI and warns that scanning deducts money', () => {
  const qrPayload =
    'upi://pay?pa=merchant.refund99@okaxis&pn=OLX%20Cashback%20Refund%20Claim&am=4500.00&cu=INR&tn=Scan%20to%20Receive%20Rs%204500';
  const qrResult = analyzeQrPayload(qrPayload);

  assert.equal(qrResult.payloadType, 'UPI Payment Request');
  assert.equal(qrResult.riskBand, 'High concern');
  assert.equal(qrResult.upiDetails?.isUpiUri, true);
  assert.equal(qrResult.upiDetails?.amount, '₹4500.00');
  assert.ok(qrResult.warningSigns.some((w) => w.id === 'qr-upi-outgoing'));
  assert.ok(qrResult.warningSigns.some((w) => w.id === 'qr-upi-deceptive-note'));
});

test('extracts URLs safely without visiting and detects PII patterns', () => {
  const urls = extractUrlsWithoutOpening('Check https://bit.ly/3xYzAbc and http://192.168.1.50/verify.');
  assert.equal(urls.length, 2);
  assert.equal(urls[0].isShortener, true);
  assert.equal(urls[0].isTrustedDomain, false);
  assert.equal(urls[1].isIpAddress, true);
  assert.equal(urls[1].isTrustedDomain, false);

  const pii = checkPiiPresence('My PAN is ABCDE1234F and Aadhaar 1234 5678 9012');
  assert.equal(pii.hasPii, true);
});

test('calculates lesson and quiz progress accurately', () => {
  const summary = calculateProgressSummary(
    {
      completedLessonIds: ['b-phishing', 'b-links'],
      quizScores: {
        'b-phishing': { score: 3, total: 3 },
        'b-links': { score: 2, total: 3 },
      },
    },
    6
  );

  assert.equal(summary.completedCount, 2);
  assert.equal(summary.completionPercentage, 33);
  assert.equal(summary.totalQuizCorrect, 5);
  assert.equal(summary.totalQuizQuestionsAnswered, 6);
  assert.equal(summary.averageQuizPercentage, 83);
});

test('regression: exact trusted hostname is trusted according to the allowlist', () => {
  assert.equal(isTrustedHostname('sbi.co.in'), true);
  assert.equal(isTrustedHostname('onlinesbi.sbi'), true);
  assert.equal(isTrustedHostname('cybercrime.gov.in'), true);

  const detail = inspectUrlCandidate('https://sbi.co.in/personal-banking');
  assert.ok(detail);
  assert.equal(detail.hostname, 'sbi.co.in');
  assert.equal(detail.isTrustedDomain, true);
  assert.equal(detail.hasLookalikeKeyword, false);

  // Custom configurable allowlist
  assert.equal(
    isTrustedHostname('portal.example.edu.in', {
      trustedDomains: ['example.edu.in'],
      allowSubdomains: true,
    }),
    true
  );
  assert.equal(
    isTrustedHostname('sbi.co.in', {
      trustedDomains: ['example.edu.in'],
    }),
    false
  );
});

test('regression: legitimate subdomain is trusted only if the configured policy permits it', () => {
  // Default policy permits legitimate subdomains at a strict DNS label boundary
  assert.equal(isTrustedHostname('www.sbi.co.in'), true);
  assert.equal(isTrustedHostname('retail.onlinesbi.sbi'), true);

  const subAllowed = inspectUrlCandidate('https://www.sbi.co.in/login', {
    trustedDomains: ['sbi.co.in'],
    allowSubdomains: true,
  });
  assert.ok(subAllowed);
  assert.equal(subAllowed.isTrustedDomain, true);
  assert.equal(subAllowed.hasLookalikeKeyword, false);

  // Strict exact-match policy (allowSubdomains: false) rejects subdomains
  assert.equal(
    isTrustedHostname('www.sbi.co.in', {
      trustedDomains: ['sbi.co.in'],
      allowSubdomains: false,
    }),
    false
  );
  assert.equal(
    isTrustedHostname('sbi.co.in', {
      trustedDomains: ['sbi.co.in'],
      allowSubdomains: false,
    }),
    true
  );

  const subDisallowed = inspectUrlCandidate('https://www.sbi.co.in/login', {
    trustedDomains: ['sbi.co.in'],
    allowSubdomains: false,
  });
  assert.ok(subDisallowed);
  assert.equal(subDisallowed.isTrustedDomain, false);
});

test('regression: lookalike domains "sbi.co.in.fake-example.com", "not-sbi.co.in", and "sbi-co-in.com" are NOT trusted', () => {
  const maliciousDomains = [
    'sbi.co.in.fake-example.com',
    'not-sbi.co.in',
    'sbi-co-in.com',
    'onlinesbi.sbi.attacker.com',
    'fake-hdfcbank.com',
    'cybercrime-gov.in',
  ];

  for (const domain of maliciousDomains) {
    assert.equal(
      isTrustedHostname(domain),
      false,
      `Expected ${domain} NOT to be trusted`
    );

    const inspected = inspectUrlCandidate(`https://${domain}/login`);
    assert.ok(inspected, `Expected ${domain} URL to be parsed for inspection`);
    assert.equal(inspected.hostname, domain);
    assert.equal(inspected.isTrustedDomain, false, `Expected ${domain} isTrustedDomain to be false`);
    assert.equal(inspected.hasLookalikeKeyword, true, `Expected ${domain} to flag lookalike keyword`);

    const analysis = analyzeScamContent(`Visit https://${domain}/login`);
    assert.notEqual(analysis.riskBand, 'Lower concern');
    assert.ok(
      analysis.warningSigns.some((w) => w.id === `url-lookalike-${domain}`),
      `Expected lookalike warning sign for ${domain}`
    );
  }
});

test('regression: trusted hostname appearing only in the URL path or query string is NOT trusted', () => {
  const pathUrl = 'https://fake-example.com/sbi.co.in/login';
  const queryUrl = 'https://fake-example.com/verify?redirect=https://sbi.co.in';

  const pathInspected = inspectUrlCandidate(pathUrl);
  assert.ok(pathInspected);
  assert.equal(pathInspected.hostname, 'fake-example.com');
  assert.equal(pathInspected.isTrustedDomain, false);
  assert.equal(pathInspected.hasLookalikeKeyword, true);

  const queryInspected = inspectUrlCandidate(queryUrl);
  assert.ok(queryInspected);
  assert.equal(queryInspected.hostname, 'fake-example.com');
  assert.equal(queryInspected.isTrustedDomain, false);
  assert.equal(queryInspected.hasLookalikeKeyword, true);

  // Ensure extractUrlsWithoutOpening does not extract the embedded query/path domain as a separate trusted URL
  const extractedFromQuery = extractUrlsWithoutOpening(`Click ${queryUrl} to continue`);
  assert.equal(extractedFromQuery.length, 1);
  assert.equal(extractedFromQuery[0].hostname, 'fake-example.com');
  assert.equal(extractedFromQuery[0].isTrustedDomain, false);
});

test('regression: URL with a username that imitates a trusted domain is NOT trusted', () => {
  const userInfoUrl = 'https://sbi.co.in@fake-example.com/login';
  const userPassUrl = 'https://onlinesbi.sbi:secret123@fake-example.com/verify';

  for (const raw of [userInfoUrl, userPassUrl]) {
    const inspected = inspectUrlCandidate(raw);
    assert.ok(inspected);
    assert.equal(inspected.hostname, 'fake-example.com');
    assert.equal(inspected.isTrustedDomain, false);
    assert.equal(inspected.hasEmbeddedAtSymbol, true);
    assert.equal(inspected.hasLookalikeKeyword, true);

    const analysis = analyzeScamContent(raw);
    assert.equal(analysis.riskBand, 'High concern');
    assert.ok(analysis.warningSigns.some((w) => w.id.startsWith('url-anomaly-')));
    assert.ok(analysis.warningSigns.some((w) => w.id.startsWith('url-lookalike-')));
  }
});

test('regression: malformed URLs and unsupported protocols (javascript:, data:, file:, ftp:) are rejected safely', () => {
  const invalidOrUnsupported = [
    'javascript:alert(1)',
    'javascript:window.location="https://sbi.co.in"',
    'javascript://sbi.co.in/%0Aalert(1)',
    'data:text/html,<script>alert("https://sbi.co.in")</script>',
    'vbscript:msgbox("sbi.co.in")',
    'file:///etc/passwd',
    'ftp://sbi.co.in/files',
    'mailto:support@sbi.co.in',
    'http://',
    'https://',
    'http:///sbi.co.in',
    'https://..',
    'https://.sbi.co.in',
    'https://sbi..co.in',
    'https://sbi.co.in..',
    'https://sbi.co.in:99999/login',
    'https://sbi.co.in:notaport/login',
    'https://sbi.co.in:/login',
    'http://exa mple.com',
  ];

  for (const input of invalidOrUnsupported) {
    assert.equal(
      inspectUrlCandidate(input),
      null,
      `Expected inspectUrlCandidate to reject "${input}"`
    );
    assert.deepEqual(
      extractUrlsWithoutOpening(input),
      [],
      `Expected extractUrlsWithoutOpening to return [] for "${input}"`
    );
  }

  // Also ensure dangerous schemes trigger a high-risk warning sign in analyzeScamContent
  const jsAnalysis = analyzeScamContent('javascript:window.location="https://sbi.co.in"');
  assert.equal(jsAnalysis.extractedUrls.length, 0);
  assert.ok(jsAnalysis.warningSigns.some((w) => w.id === 'url-dangerous-scheme'));
});

test('regression: hostnames with uppercase letters, ports, and trailing dots are handled consistently', () => {
  assert.equal(normalizeHostname('SBI.CO.IN.'), 'sbi.co.in');
  assert.equal(normalizeHostname('WWW.SBI.CO.IN.'), 'www.sbi.co.in');
  assert.equal(normalizeHostname('SBI.CO.IN.FAKE-EXAMPLE.COM.'), 'sbi.co.in.fake-example.com');

  const trustedWithUpperPortDot = inspectUrlCandidate('https://SBI.CO.IN.:8443/netbanking');
  assert.ok(trustedWithUpperPortDot);
  assert.equal(trustedWithUpperPortDot.hostname, 'sbi.co.in');
  assert.equal(trustedWithUpperPortDot.port, '8443');
  assert.equal(trustedWithUpperPortDot.isTrustedDomain, true);
  assert.equal(trustedWithUpperPortDot.hasLookalikeKeyword, false);

  const untrustedWithUpperPortDot = inspectUrlCandidate(
    'https://SBI.CO.IN.FAKE-EXAMPLE.COM.:8080/login'
  );
  assert.ok(untrustedWithUpperPortDot);
  assert.equal(untrustedWithUpperPortDot.hostname, 'sbi.co.in.fake-example.com');
  assert.equal(untrustedWithUpperPortDot.port, '8080');
  assert.equal(untrustedWithUpperPortDot.isTrustedDomain, false);
  assert.equal(untrustedWithUpperPortDot.hasLookalikeKeyword, true);

  const notSbiWithUpperPortDot = inspectUrlCandidate('https://NOT-SBI.CO.IN.:443/verify');
  assert.ok(notSbiWithUpperPortDot);
  assert.equal(notSbiWithUpperPortDot.hostname, 'not-sbi.co.in');
  assert.equal(notSbiWithUpperPortDot.isTrustedDomain, false);
  assert.equal(notSbiWithUpperPortDot.hasLookalikeKeyword, true);
});
