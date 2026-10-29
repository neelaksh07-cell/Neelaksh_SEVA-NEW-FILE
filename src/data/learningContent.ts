export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface SimulatedScamArtifact {
  channel: 'SMS' | 'WhatsApp' | 'Email' | 'Phone Call Transcript' | 'Payment Screen';
  senderHeader: string;
  timestamp: string;
  messageBody: string;
  redFlagsAnnotated: {
    snippet: string;
    reason: string;
  }[];
  safeAction: string;
}

export interface LearningModule {
  id: string;
  level: SkillLevel;
  topicTag: string;
  title: string;
  readTime: string;
  summary: string;
  keyTakeaways: string[];
  howItWorks: string[];
  simulation: SimulatedScamArtifact;
  quiz: QuizQuestion[];
}

export interface SampleMessageItem {
  id: string;
  label: string;
  category: string;
  expectedBand: 'Lower concern' | 'Suspicious' | 'High concern';
  content: string;
}

export interface SampleScreenshotScenario {
  id: string;
  title: string;
  channel: 'SMS Alert' | 'Email Notice' | 'WhatsApp Job Offer';
  sender: string;
  subjectOrHeader: string;
  timestamp: string;
  simulatedTextLines: string[];
  description: string;
}

export interface SampleQrScenario {
  id: string;
  title: string;
  contextDescription: string;
  claimMadeBySender: string;
  qrPayload: string;
  badgeLabel: string;
}

export const LEARNING_MODULES: LearningModule[] = [
  {
    id: 'b-phishing',
    level: 'Beginner',
    topicTag: 'Phishing & Fake Alerts',
    title: 'Spotting Urgent SMS & Email Phishing Traps',
    readTime: '4 min read',
    summary:
      'Learn how scammers imitate electricity boards, banks, and delivery services using panic deadlines and personal mobile numbers.',
    keyTakeaways: [
      'Scammers manufacture artificial urgency ("power disconnected at 9:30 PM tonight") to stop you from thinking calmly.',
      'Official electricity boards and banks never ask you to call a personal 10-digit mobile number for bill or KYC updates.',
      'Always check bill status directly inside your official utility app or on the printed bill’s official portal.',
    ],
    howItWorks: [
      'You receive an unexpected SMS or WhatsApp message claiming your electricity bill, FASTag, or bank KYC is unpaid or expired.',
      'The message threatens immediate disconnection within a few hours and lists a mobile number or unfamiliar link.',
      'If you call or click, the scammer asks you to pay a "verification fee" or install a remote screen-sharing app.',
    ],
    simulation: {
      channel: 'SMS',
      senderHeader: '+91 98XXX-XX210 (Unknown Mobile)',
      timestamp: 'Today, 7:15 PM',
      messageBody:
        '[EDUCATIONAL SIMULATION] Dear Consumer, Your Electricity power will be disconnected tonight at 9:30 PM from BESCOM office because your previous month bill was not updated. Please immediately contact our billing officer at +91 89000-00000 or visit http://bescom-power-verify.xyz',
      redFlagsAnnotated: [
        {
          snippet: '+91 98XXX-XX210 / +91 89000-00000',
          reason: 'State electricity utilities send alerts via registered alphanumeric headers (e.g. VM-BESCOM) and official toll-free helplines (like 1912), never personal 10-digit mobile numbers.',
        },
        {
          snippet: 'disconnected tonight at 9:30 PM',
          reason: 'Artificial panic deadline designed to make you act before checking your actual bill receipt.',
        },
        {
          snippet: 'http://bescom-power-verify.xyz',
          reason: 'Unencrypted HTTP link on a cheap ".xyz" domain instead of the official ".gov.in" or ".org" portal.',
        },
      ],
      safeAction:
        'Do not call the number or click the link. Open your official electricity provider app or check your consumer number on the official state portal.',
    },
    quiz: [
      {
        id: 'q-b1-1',
        question:
          'You receive an SMS at 8:00 PM saying your home electricity will be cut at 9:30 PM unless you call a 10-digit mobile number in the message. What is the safest first step?',
        options: [
          {
            id: 'a',
            text: 'Call the 10-digit number quickly to explain that you already paid the bill.',
            isCorrect: false,
            explanation:
              'Calling the number inside a suspicious SMS connects you directly to the scammer’s call centre, where they will pressure you into sharing OTPs or installing apps.',
          },
          {
            id: 'b',
            text: 'Ignore the number in the SMS and check your bill status using the official utility website or your previous printed bill.',
            isCorrect: true,
            explanation:
              'Correct! Verifying independently through known official channels completely bypasses the scammer’s trap.',
          },
          {
            id: 'c',
            text: 'Click the link in the SMS just to see if it looks like your electricity company’s website.',
            isCorrect: false,
            explanation:
              'Visual appearance can be copied easily. Visiting suspicious links can expose your browser or trick you with a cloned login page.',
          },
        ],
      },
      {
        id: 'q-b1-2',
        question: 'Why do phishing messages almost always include phrases like "within 2 hours" or "tonight at 9:30 PM"?',
        options: [
          {
            id: 'a',
            text: 'Because bank servers automatically delete inactive accounts every night.',
            isCorrect: false,
            explanation:
              'Banks and utilities follow regulated notice periods and never shut down accounts on a 2-hour SMS ultimatum.',
          },
          {
            id: 'b',
            text: 'To trigger fear and urgency so you act before consulting family members or official sources.',
            isCorrect: true,
            explanation:
              'Correct! Time pressure is a psychological tactic used to bypass careful verification.',
          },
          {
            id: 'c',
            text: 'Because customer support only works late at night.',
            isCorrect: false,
            explanation:
              'Scammers send messages in the evening specifically hoping official branch offices are closed so you cannot verify easily.',
          },
        ],
      },
    ],
  },
  {
    id: 'b-links',
    level: 'Beginner',
    topicTag: 'Suspicious Links',
    title: 'Decoding Lookalike Domains & Shortened Links',
    readTime: '5 min read',
    summary:
      'Understand how web addresses are structured so you can spot fake bank domains, link shorteners, and misleading subdomains before clicking.',
    keyTakeaways: [
      'Read a domain name from right to left before the first single slash "/": in "sbi.kyc-update.top/login", the real domain is "kyc-update.top", NOT "sbi".',
      'Link shorteners (like bit.ly or cutt.ly) hide the true destination and are rarely used by banks for critical account verification.',
      'HTTPS (the padlock icon) only means the connection is encrypted—scammers can easily put HTTPS on a fake phishing domain too.',
    ],
    howItWorks: [
      'Attackers register cheap domain names containing familiar Indian brand keywords (e.g., "hdfc-pan-verify.xyz" or "indiapost-customs.top").',
      'They place the trusted brand name at the beginning as a subdomain so mobile screens truncate the suspicious ending.',
      'To hide the fake domain completely, they may wrap it inside a public URL shortener.',
    ],
    simulation: {
      channel: 'SMS',
      senderHeader: 'AD-PANUPD (Simulated)',
      timestamp: 'Yesterday, 2:40 PM',
      messageBody:
        '[EDUCATIONAL SIMULATION] Dear Customer, Your Bank Account will be blocked today as PAN card is not updated. Click here to verify PAN immediately: https://onlinesbi.pan-verification-portal.top/auth',
      redFlagsAnnotated: [
        {
          snippet: 'onlinesbi.pan-verification-portal.top',
          reason:
            'Look at the words right before "/auth": the registered domain is "pan-verification-portal.top". "onlinesbi" is just a subdomain prefix added to trick the eye.',
        },
        {
          snippet: 'https://',
          reason:
            'Even though the link starts with "https://", it still belongs to an untrusted ".top" domain. HTTPS does not mean the website owner is legitimate.',
        },
      ],
      safeAction:
        'Never sign in through links sent via SMS. Type the bank’s official address (such as onlinesbi.sbi) manually in your browser or use the official mobile banking app.',
    },
    quiz: [
      {
        id: 'q-b2-1',
        question:
          'In the web address "https://icicibank.customer-kyc-check.xyz/login", which website actually owns and controls the page?',
        options: [
          {
            id: 'a',
            text: 'icicibank.com',
            isCorrect: false,
            explanation:
              '"icicibank" is placed as a subdomain at the front. The actual domain owner is determined by the root domain right before the first single slash.',
          },
          {
            id: 'b',
            text: 'customer-kyc-check.xyz',
            isCorrect: true,
            explanation:
              'Correct! Reading right-to-left before "/login" shows the real registered domain is "customer-kyc-check.xyz", which is a lookalike trap.',
          },
          {
            id: 'c',
            text: 'Both organisations share the domain equally.',
            isCorrect: false,
            explanation:
              'Anyone who buys "customer-kyc-check.xyz" can create any subdomain prefix (like "icicibank.") without the bank’s permission.',
          },
        ],
      },
      {
        id: 'q-b2-2',
        question: 'Does a padlock icon or "https://" at the start of a link prove that a banking website is genuine?',
        options: [
          {
            id: 'a',
            text: 'Yes, only verified banks can get an HTTPS certificate.',
            isCorrect: false,
            explanation:
              'Free HTTPS certificates can be obtained automatically by anyone—including phishing sites—in minutes.',
          },
          {
            id: 'b',
            text: 'No, HTTPS only means data sent to that site is encrypted in transit; it does not verify that the site owner is your real bank.',
            isCorrect: true,
            explanation:
              'Correct! Always verify the exact domain name, not just the presence of HTTPS.',
          },
        ],
      },
    ],
  },
  {
    id: 'i-support',
    level: 'Intermediate',
    topicTag: 'Fake Customer Support',
    title: 'Fake Helpline Numbers & Screen-Sharing App Scams',
    readTime: '5 min read',
    summary:
      'Discover how scammers plant fake customer-care numbers online and trick victims into installing remote-access apps like AnyDesk or TeamViewer.',
    keyTakeaways: [
      'Scammers post fake customer-support phone numbers in social media comments, map listings, and search ads for airlines, courier companies, and wallets.',
      'No legitimate bank or customer care executive will ever ask you to install AnyDesk, TeamViewer, QuickSupport, or an unknown `.apk` file.',
      'Once a screen-sharing app is active, the scammer can read every incoming SMS OTP on your screen in real time.',
    ],
    howItWorks: [
      'A user searches online for a helpline to track a delayed parcel, cancel a flight, or fix a failed UPI transaction.',
      'They call a convincingly worded but fraudulent number posted in a comment or unverified listing.',
      'The fake "support executive" asks the user to install a "refund verification app" (actually AnyDesk or a malicious APK) and share the 9-digit connection code.',
    ],
    simulation: {
      channel: 'Phone Call Transcript',
      senderHeader: 'Caller claiming to be "FastCourier Refund Desk"',
      timestamp: 'Simulated Audio Transcript',
      messageBody:
        '[EDUCATIONAL SIMULATION] Caller: "Sir, to process your ₹480 delivery refund immediately, our server needs to generate a complaint token on your phone. Please download the customer support helper app AnyDesk from Play Store and read me the 9-digit workspace address shown on your screen. Then make a ₹2 test transfer on UPI so your bank account links to our refund gateway."',
      redFlagsAnnotated: [
        {
          snippet: 'download the customer support helper app AnyDesk',
          reason:
            'AnyDesk is a remote desktop tool. Giving the 9-digit code lets the caller view your entire phone screen live, including bank balances and OTP notifications.',
        },
        {
          snippet: 'make a ₹2 test transfer on UPI',
          reason:
            'Asking you to perform a "test transfer" while your screen is shared lets them see your UPI habits or trick you into approving a much larger collect request.',
        },
      ],
      safeAction:
        'Hang up immediately. Never install screen-sharing software for customer support, and only find helpline numbers inside the official app or on the back of your bank card.',
    },
    quiz: [
      {
        id: 'q-i1-1',
        question:
          'You call a customer support number found in a public comment thread, and the agent asks you to install "AnyDesk" or "QuickSupport" to process a refund. What happens if you share the code?',
        options: [
          {
            id: 'a',
            text: 'It only shares the specific courier app window, keeping your SMS and banking apps private.',
            isCorrect: false,
            explanation:
              'Screen-sharing apps broadcast your entire screen—including pop-up SMS OTP banners and banking apps—to the remote viewer.',
          },
          {
            id: 'b',
            text: 'The caller can view your entire phone screen in real time, read your incoming OTPs, and guide you into authorizing fraudulent transfers.',
            isCorrect: true,
            explanation:
              'Correct! Remote-access apps give scammers visibility into everything displayed on your phone.',
          },
          {
            id: 'c',
            text: 'It automatically refunds the money without needing a bank account.',
            isCorrect: false,
            explanation:
              'Refunds never require remote screen access; legitimate merchants refund directly to the original payment method.',
          },
        ],
      },
      {
        id: 'q-i1-2',
        question: 'Where is the safest place to find your bank’s genuine customer-care phone number?',
        options: [
          {
            id: 'a',
            text: 'The first phone number replied by a user on social media or a public forum.',
            isCorrect: false,
            explanation:
              'Scammers use automated bots to reply to customer complaints on social media within seconds with fake helpline numbers.',
          },
          {
            id: 'b',
            text: 'Printed on the back of your official debit/credit card or inside the bank’s verified mobile app.',
            isCorrect: true,
            explanation:
              'Correct! The number printed on your physical bank card or inside the official app is verified and tamper-resistant.',
          },
        ],
      },
    ],
  },
  {
    id: 'i-payment',
    level: 'Intermediate',
    topicTag: 'Payment & Job Scams',
    title: 'UPI Collect Requests, Fake Cashback & Task Scams',
    readTime: '5 min read',
    summary:
      'Protect your money from deceptive UPI collect requests, fake "mistaken transfer" refund pleas, and prepaid Telegram/WhatsApp task scams.',
    keyTakeaways: [
      'Entering your UPI PIN ALWAYS deducts money from your bank account. You never enter a UPI PIN to receive money.',
      'Beware of "part-time rating/liking jobs" on WhatsApp or Telegram that pay ₹150–₹500 initially to win your trust before demanding large "prepaid task deposits".',
      'If a stranger messages that they "accidentally sent ₹5,000 via UPI" based on a fake SMS screenshot, verify your actual bank statement before sending any money back.',
    ],
    howItWorks: [
      'In a UPI Collect Scam, a fraudster sends a payment request with a note saying "Crediting ₹5,000 Cashback—Click Pay & Enter PIN to Receive".',
      'In a Prepaid Task Scam, victims are paid small amounts for liking videos or rating hotels, then told to deposit ₹10,000–₹50,000 to unlock "VIP tasks"—after which their money is locked forever.',
    ],
    simulation: {
      channel: 'WhatsApp',
      senderHeader: '+91 70XXX-XX912 • "HR Manager - Digital Marketing Tasks"',
      timestamp: 'Today, 11:20 AM',
      messageBody:
        '[EDUCATIONAL SIMULATION] Congratulations! You earned ₹300 for completing 3 Google Map review tasks. Now join our VIP Welfare Group! Deposit ₹5,000 security recharge to unlock Task #4 and get instant ₹7,200 payout within 10 minutes. Contact Telegram receptionist @vip_task_desk_in',
      redFlagsAnnotated: [
        {
          snippet: 'earned ₹300 for completing 3 Google Map review tasks',
          reason:
            'Scammers intentionally pay a small real sum (₹150–₹300) at the beginning as bait so victims believe the scheme is genuine.',
        },
        {
          snippet: 'Deposit ₹5,000 security recharge to unlock Task #4',
          reason:
            'Legitimate employers never ask workers to deposit money to unlock tasks or receive salary.',
        },
      ],
      safeAction:
        'Stop engaging immediately and never deposit money to "unlock" earnings or pay "tax/release fees" on task platforms.',
    },
    quiz: [
      {
        id: 'q-i2-1',
        question:
          'A buyer on a classifieds site wants to pay you ₹8,000 for an old bicycle. They send a UPI notification to your phone that has a "Pay ₹8,000" button and ask you to enter your UPI PIN. What will happen if you enter your PIN?',
        options: [
          {
            id: 'a',
            text: '₹8,000 will be credited into your bank account.',
            isCorrect: false,
            explanation:
              'Receiving money via UPI never requires clicking "Pay" or entering your UPI PIN.',
          },
          {
            id: 'b',
            text: '₹8,000 will be debited (sent out) from your bank account to the scammer.',
            isCorrect: true,
            explanation:
              'Correct! A UPI PIN is strictly for authorizing outgoing payments from your account.',
          },
        ],
      },
      {
        id: 'q-i2-2',
        question:
          'Why do online "like-and-earn" task scammers sometimes actually transfer ₹150 or ₹300 to your account on the first day?',
        options: [
          {
            id: 'a',
            text: 'Because the first few tasks are sponsored by real companies.',
            isCorrect: false,
            explanation:
              'The entire setup is controlled by the fraud syndicate; the fake tasks have no real commercial value.',
          },
          {
            id: 'b',
            text: 'To build false trust so you feel confident depositing thousands of rupees in later "prepaid VIP rounds".',
            isCorrect: true,
            explanation:
              'Correct! Small initial payouts are psychological bait used before demanding large "recharge" deposits.',
          },
        ],
      },
    ],
  },
  {
    id: 'a-qr',
    level: 'Advanced',
    topicTag: 'QR-Code Risks',
    title: 'QR-Code Scams (Quishing) & Deceptive UPI Payloads',
    readTime: '6 min read',
    summary:
      'Learn how QR codes encode data, why scanning a QR code can never "receive" money on UPI, and how pasted sticker QR codes redirect to phishing sites.',
    keyTakeaways: [
      'A QR code is just machine-readable text (like a `upi://pay?...` payment instruction or an `https://...` web link).',
      'UPI QR codes always use the `upi://pay` scheme—scanning one prepares an OUTGOING payment to the `pa=` (payee address) parameter.',
      'Always inspect the decoded text or payee name before acting, and never let a scanner automatically open unknown websites.',
    ],
    howItWorks: [
      'Scammers send a QR code image on WhatsApp claiming it is a "Refund Voucher QR" or "Scan to Receive Buyer Advance".',
      'Inside the QR code is a standard `upi://pay?pa=scammer@upi&am=4500&tn=Cashback` string. Because the transaction note (`tn=`) says "Cashback", hurried users enter their UPI PIN and lose ₹4,500.',
      'In public places, scammers also paste fake QR stickers over parking meters or utility posters that lead to phishing URLs.',
    ],
    simulation: {
      channel: 'Payment Screen',
      senderHeader: 'Decoded QR Code Payload Inspection',
      timestamp: 'Static Payload Analysis',
      messageBody:
        '[EDUCATIONAL SIMULATION] Raw QR String: upi://pay?pa=refund.claim99@okicici&pn=Army%20Canteen%20Advance%20Order&am=6500.00&cu=INR&tn=Scan%20and%20Enter%20PIN%20to%20Receive%20Rs%206500',
      redFlagsAnnotated: [
        {
          snippet: 'upi://pay?pa=refund.claim99@okicici',
          reason:
            'The protocol "upi://pay" instructs your UPI app to PAY money TO "refund.claim99@okicici".',
        },
        {
          snippet: 'am=6500.00',
          reason:
            'Locks in an outgoing debit amount of ₹6,500.00 from your bank account.',
        },
        {
          snippet: 'tn=Scan%20and%20Enter%20PIN%20to%20Receive%20Rs%206500',
          reason:
            'The scammer wrote a misleading message in the optional Transaction Note ("tn") field to trick you into thinking money is coming in.',
        },
      ],
      safeAction:
        'Use a safe QR inspector (like SEVA CyberGuard’s QR Checker) to read the raw destination text without executing it, and never scan a QR code when you are the person supposed to receive money.',
    },
    quiz: [
      {
        id: 'q-a1-1',
        question:
          'When you decode a QR code and see `upi://pay?pa=shop99@ybl&pn=Cashback%20Reward&am=2000`, what does the `tn` or `pn` text ("Cashback Reward") actually do technically?',
        options: [
          {
            id: 'a',
            text: 'It switches the UPI transaction mode from debit to credit.',
            isCorrect: false,
            explanation:
              'Display labels like `pn` (payee name) and `tn` (transaction note) never change the direction of a `upi://pay` transaction.',
          },
          {
            id: 'b',
            text: 'Nothing technical—it is just a text label chosen by whoever generated the QR code, while `upi://pay` still deducts ₹2,000 from your account.',
            isCorrect: true,
            explanation:
              'Correct! Anyone can put the word "Cashback" or "Refund" as the display name or note inside a payment QR code.',
          },
        ],
      },
      {
        id: 'q-a1-2',
        question: 'Why is it risky when a QR scanner app automatically opens web links in your browser immediately after scanning?',
        options: [
          {
            id: 'a',
            text: 'Because it prevents you from inspecting the domain name first and may trigger an unwanted `.apk` download or load a cloned login page.',
            isCorrect: true,
            explanation:
              'Correct! Inspecting the decoded URL as plain text before visiting protects you from hidden phishing domains and drive-by downloads.',
          },
          {
            id: 'b',
            text: 'Because QR codes can only store official government websites.',
            isCorrect: false,
            explanation:
              'Anyone can generate a QR code pointing to any URL on the internet for free.',
          },
        ],
      },
    ],
  },
  {
    id: 'a-impersonation',
    level: 'Advanced',
    topicTag: 'Authority Impersonation',
    title: 'Parcel Customs Threats, "Digital Arrest" & Spoofed Identity Scams',
    readTime: '6 min read',
    summary:
      'Recognise high-pressure psychological manipulation where scammers pose as Customs, Police, CBI, or TRAI officials claiming your Aadhaar is linked to a crime.',
    keyTakeaways: [
      'There is NO such legal concept as a "Digital Arrest" or online video-call custody in Indian law.',
      'Police, CBI, Customs, ED, and RBI never ask citizens to stay on uninterrupted Skype/WhatsApp video calls or transfer funds to a "safe verification account".',
      'If a family member or colleague messages urgently from a new number asking for emergency money, always call their known phone number directly to verify their voice.',
    ],
    howItWorks: [
      'You receive an automated call claiming to be from TRAI, FedEx/India Post Customs, or Mumbai/Delhi Cyber Police stating a parcel in your name contained illegal items or forged passports.',
      'The call is "transferred" to a fake officer in uniform on a WhatsApp or Skype video call who shows a fabricated arrest warrant with your Aadhaar details.',
      'They forbid you from disconnecting the call ("digital arrest") and demand you transfer your savings to an account for "RBI audit verification".',
    ],
    simulation: {
      channel: 'Phone Call Transcript',
      senderHeader: 'IVR Call -> Fake "Customs & Cyber Crime Cell" Video Call',
      timestamp: 'Simulated High-Pressure Scenario',
      messageBody:
        '[EDUCATIONAL SIMULATION] "Press 1 to know why your mobile numbers are being disconnected by TRAI... Hello, I am Inspector Sharma from Narcotics & Cyber Division. An international parcel booked using your Aadhaar card was seized at the airport. You are placed under Digital Arrest on this video call. Do not speak to your family. Transfer your bank balance to our temporary verification account within 30 minutes or local police will arrest you immediately."',
      redFlagsAnnotated: [
        {
          snippet: 'placed under Digital Arrest on this video call',
          reason:
            'Government of India and CERT-In/I4C have repeatedly clarified that "Digital Arrest" does not exist in law. Real law enforcement never detains or interrogates people over WhatsApp/Skype video calls.',
        },
        {
          snippet: 'Do not speak to your family',
          reason:
            'Isolation tactic: scammers keep you on the call continuously so nobody around you can point out that it is a scam.',
        },
        {
          snippet: 'Transfer your bank balance to our temporary verification account',
          reason:
            'No court, police agency, or RBI department ever asks citizens to transfer money into an account to prove innocence.',
        },
      ],
      safeAction:
        'Disconnect the call immediately, speak to a trusted family member, and report the incident at 1930 or cybercrime.gov.in.',
    },
    quiz: [
      {
        id: 'q-a2-1',
        question:
          'A caller in police uniform on a WhatsApp video call shows an official-looking ID and says you are under "Digital Arrest" until you transfer your funds for RBI verification. What is true about this situation?',
        options: [
          {
            id: 'a',
            text: 'It is 100% a scam—"Digital Arrest" does not exist in Indian law, and police/RBI never ask you to transfer money for verification.',
            isCorrect: true,
            explanation:
              'Correct! Law enforcement agencies never conduct video-call arrests or demand bank transfers to clear criminal allegations.',
          },
          {
            id: 'b',
            text: 'You must stay on the video call and transfer the money because they showed a uniform on camera.',
            isCorrect: false,
            explanation:
              'Scammers set up fake studio backgrounds and wear rented uniforms specifically to intimidate victims on video calls.',
          },
        ],
      },
      {
        id: 'q-a2-2',
        question:
          'If you or someone in your family realizes they just lost money to a cyber fraud in India, which official national helpline number should be dialled immediately?',
        options: [
          {
            id: 'a',
            text: '1930 (National Cyber Crime Helpline / cybercrime.gov.in)',
            isCorrect: true,
            explanation:
              'Correct! Calling 1930 or reporting on cybercrime.gov.in in the "Golden Hour" helps the Citizen Financial Cyber Fraud Reporting and Management System (CFCFRMS) freeze fraudulent transactions.',
          },
          {
            id: 'b',
            text: 'Search social media for a "cyber recovery hacker" who promises to get the money back for a fee.',
            isCorrect: false,
            explanation:
              '"Recovery agents" on social media are secondary scammers who target victims a second time by charging fake recovery fees.',
          },
        ],
      },
    ],
  },
];

export const SAMPLE_SCAM_MESSAGES: SampleMessageItem[] = [
  {
    id: 'sample-electricity',
    label: 'Sample 1: Fake Electricity Disconnection SMS (Sample Data)',
    category: 'Utility Impersonation',
    expectedBand: 'High concern',
    content:
      'Dear Consumer, your Electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately call our billing officer at 9876500000 or update online at http://power-bill-verify.xyz/pay',
  },
  {
    id: 'sample-kyc-url',
    label: 'Sample 2: Fake Bank PAN/KYC Link (Sample Data)',
    category: 'Phishing Link',
    expectedBand: 'High concern',
    content:
      'URGENT ALERT: Your SBI Bank Account and YONO access has been suspended today as your PAN card KYC is expired. Click the link within 2 hours to submit OTP and reactivate: https://onlinesbi.kyc-pan-portal.top/verify',
  },
  {
    id: 'sample-task-job',
    label: 'Sample 3: WhatsApp Part-Time Task Lure (Sample Data)',
    category: 'Job / Payment Scam',
    expectedBand: 'High concern',
    content:
      'Congratulations! Your mobile number was selected for part-time work from home. Earn ₹3,500 to ₹8,000 daily by rating hotels on Google Maps. Pay ₹1,000 registration fee via UPI or download our task APK at https://bit.ly/daily-task-bonus',
  },
  {
    id: 'sample-shortener',
    label: 'Sample 4: Ambiguous Delivery Link with Shortener (Sample Data)',
    category: 'Suspicious URL',
    expectedBand: 'Suspicious',
    content:
      'Package Delivery Update: We attempted to deliver your shipment #IN49201 today but the address was incomplete. Please check delivery preferences at https://cutt.ly/parcel-track-99',
  },
  {
    id: 'sample-benign',
    label: 'Sample 5: Normal College / Community Notice (Sample Data)',
    category: 'Low-Concern Reference',
    expectedBand: 'Lower concern',
    content:
      'Reminder: The Campus Digital Safety Workshop will be held tomorrow at 10:30 AM in the Main Auditorium. No registration fee is required. Bring your college ID card.',
  },
];

export const SAMPLE_SCREENSHOT_SCENARIOS: SampleScreenshotScenario[] = [
  {
    id: 'ss-electricity',
    title: 'Sample Screenshot A: Electricity Disconnection SMS',
    channel: 'SMS Alert',
    sender: '+91 89234-00112',
    subjectOrHeader: 'SMS Text Message • Today 8:12 PM',
    timestamp: '8:12 PM',
    description: 'Simulated mobile screenshot showing a late-evening power disconnection threat with a personal phone number and `.xyz` link.',
    simulatedTextLines: [
      'SAMPLE EDUCATIONAL SCREENSHOT',
      'From: +91 89234-00112',
      'Dear Consumer, your Electricity power will be',
      'disconnected tonight at 9:30 PM from MSEB office',
      'because your previous month bill was not updated.',
      'Call immediately officer at 9876543210 or download',
      'AnyDesk support app via http://mseb-online-kyc.xyz',
    ],
  },
  {
    id: 'ss-customs',
    title: 'Sample Screenshot B: Fake Customs & Digital Arrest Email',
    channel: 'Email Notice',
    sender: 'customs.clearance.notice@indiapost-parcel-verify.top',
    subjectOrHeader: 'FINAL WARNING: Illegal Parcel Seized in Your Aadhaar Name',
    timestamp: '10:45 AM',
    description: 'Simulated email screenshot threatening police action unless a "customs clearance deposit" is paid.',
    simulatedTextLines: [
      'SAMPLE EDUCATIONAL SCREENSHOT',
      'From: customs.clearance.notice@indiapost-parcel-verify.top',
      'Subject: FINAL NOTICE - Parcel Seized & Digital Arrest Warrant',
      'An international parcel linked to your Aadhaar card has been',
      'detained. Join video call verification immediately and pay',
      'Rs. 14,500 clearance charge or your bank accounts will be',
      'frozen within 2 hours. Portal: http://customs-verify.top/case',
    ],
  },
  {
    id: 'ss-benign',
    title: 'Sample Screenshot C: Routine Library Book Return Notice',
    channel: 'SMS Alert',
    sender: 'COLLEGE-LIB',
    subjectOrHeader: 'Campus Library Notification',
    timestamp: '4:00 PM',
    description: 'Simulated routine institutional reminder with no links, no credential requests, and no payment pressure.',
    simulatedTextLines: [
      'SAMPLE EDUCATIONAL SCREENSHOT',
      'From: COLLEGE-LIB',
      'Hello Student, your borrowed book "Computer Networks"',
      'is due for return at the Central Library counter by Friday.',
      'Please visit the library circulation desk during working hours.',
    ],
  },
];

export const SAMPLE_QR_SCENARIOS: SampleQrScenario[] = [
  {
    id: 'qr-upi-trap',
    title: 'Sample QR 1: Fake "Scan to Receive ₹4,500 Refund" Trap (Sample Data)',
    contextDescription:
      'A stranger on an online marketplace claims they are sending you a ₹4,500 advance payment and tells you to scan this QR code and enter your UPI PIN to "receive" the money.',
    claimMadeBySender: '"Scan this QR code and enter your UPI PIN to receive ₹4,500 into your bank account."',
    qrPayload:
      'upi://pay?pa=fraud.buyer99@okaxis&pn=OLX%20Cashback%20Refund%20Claim&am=4500.00&cu=INR&tn=Scan%20to%20Receive%20Rs%204500',
    badgeLabel: 'Deceptive UPI Collect QR',
  },
  {
    id: 'qr-phishing-url',
    title: 'Sample QR 2: Poster QR Leading to Lookalike KYC Portal (Sample Data)',
    contextDescription:
      'A QR code printed on a flyer promising "Instant ₹500 Festival UPI Reward—Scan to Claim" that secretly encodes a lookalike phishing domain.',
    claimMadeBySender: '"Scan with any camera to claim your ₹500 festive reward!"',
    qrPayload: 'http://sbi-reward-claim-bonus.xyz/kyc-login?ref=qr_poster',
    badgeLabel: 'Phishing Link inside QR',
  },
  {
    id: 'qr-official-info',
    title: 'Sample QR 3: Official Cyber Crime Portal Information Link (Sample Data)',
    contextDescription:
      'An educational awareness poster QR code that points to the official National Cyber Crime Reporting Portal domain (`cybercrime.gov.in`).',
    claimMadeBySender: '"Scan to view the official Government of India cybercrime reporting portal address."',
    qrPayload: 'https://cybercrime.gov.in',
    badgeLabel: 'Official .gov.in Domain',
  },
];
