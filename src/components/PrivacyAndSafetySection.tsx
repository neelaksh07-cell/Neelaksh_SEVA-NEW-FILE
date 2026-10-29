import React from 'react';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  AlertTriangle,
  PhoneCall,
  FileText,
  ExternalLink,
} from 'lucide-react';

export const PrivacyAndSafetySection: React.FC = () => {
  const safetyPrinciples = [
    {
      icon: Lock,
      title: '01. Zero Credential Requests',
      description:
        'SEVA CyberGuard never asks for your passwords, OTPs, UPI PINs, CVV numbers, Aadhaar/PAN numbers, or bank credentials under any circumstances.',
    },
    {
      icon: EyeOff,
      title: '02. Redaction-First Screenshot Guidance',
      description:
        'Before uploading any screenshot for OCR analysis, users are explicitly reminded to crop or mask personal phone numbers, account numbers, and names.',
    },
    {
      icon: ShieldCheck,
      title: '03. Minimal Storage & No Message Logging',
      description:
        'Submitted messages, URLs, screenshots, and QR images are processed transiently in memory only and are never saved to a database. Only anonymous lesson completion and quiz scores are stored locally in your browser.',
    },
    {
      icon: Server,
      title: '04. Server-Side API Isolation',
      description:
        'All optional Gemini AI requests are proxied through our server-side endpoint (/api/*). API credentials are kept strictly on the server and never exposed in browser code.',
    },
    {
      icon: AlertTriangle,
      title: '05. Untrusted Input Sandboxing',
      description:
        'Submitted messages and OCR transcripts are wrapped in strict untrusted-data delimiters so adversarial text inside a scam message is analyzed as data, never executed as instructions to the AI.',
    },
    {
      icon: FileText,
      title: '06. Transparent Limitations & Cautious Labels',
      description:
        'We never fabricate live threat-intelligence lookups or claim 100% detection accuracy. Results use cautious risk bands (Lower concern, Suspicious, High concern) paired with plain-language explanations.',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200">
        <p className="text-xs text-slate-500">
          Privacy-By-Design Architecture · Ethical Safety Guardrails · SEVA Innovation Brief
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
          Privacy, Safety Architecture & Project Documentation
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-3xl leading-relaxed">
          SEVA CyberGuard is built as an ethical student innovation prototype. Below is a transparent breakdown of how user privacy is protected, what technical limitations apply, and how to report real cybercrime in India.
        </p>
      </section>

      {/* 6 Core Privacy & Safety Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {safetyPrinciples.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <div key={idx} className="p-6 rounded-xl bg-white border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center">
                <IconComponent className="w-5 h-5" aria-hidden="true" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                {item.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </section>

      {/* Official Indian Cybercrime Emergency Reporting */}
      <section className="p-6 sm:p-8 rounded-2xl bg-teal-50/70 border border-teal-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center gap-2 text-teal-900">
              <PhoneCall className="w-5 h-5 shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-bold">
                What to Do If You Suspect Real Financial Fraud in India
              </h2>
            </div>
            <p className="text-sm text-teal-950 leading-relaxed">
              If you have inadvertently shared an OTP, clicked a malicious link, or lost money via UPI, netbanking, or card fraud, report it immediately during the “Golden Hour” so banks and law enforcement can freeze the fraudulent transfer:
            </p>
            <ul className="pt-2 space-y-1.5 text-xs sm:text-sm text-teal-950">
              <li>
                • <strong>National Toll-Free Cyber Crime Helpline:</strong> Call <code className="font-mono font-bold">1930</code> immediately (operated by MHA / I4C).
              </li>
              <li>
                • <strong>National Cyber Crime Reporting Portal:</strong> File an official report at <code className="font-mono font-bold">https://cybercrime.gov.in</code>.
              </li>
              <li>
                • <strong>Bank Emergency Block:</strong> Contact your bank’s official 24×7 helpline printed on the back of your debit/credit card to block compromised accounts or UPI IDs.
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4 p-5 rounded-xl bg-white border border-teal-200 space-y-2 text-center">
            <p className="text-xs text-slate-500">National Helpline (India)</p>
            <p className="text-3xl font-bold font-mono tabular-nums text-teal-800">
              1930
            </p>
            <p className="text-xs text-slate-600">
              Citizen Financial Cyber Fraud Reporting & Management System (CFCFRMS)
            </p>
          </div>
        </div>
      </section>

      {/* SEVA First Innovation Challenge 2026 Screen-1 Ideation Summary */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-sky-800 font-medium">
              SEVA FIRST INNOVATION CHALLENGE 2026 · SCREEN-1 IDEATION DOCUMENT
            </p>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              Student Innovation Prototype Details
            </h2>
          </div>
          <a
            href="/assets/aistudio/_new_SEVA_Screen1_Ready_to_Submit_ca7aa900.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap self-start sm:self-center shrink-0"
          >
            <span>View Attached SEVA Ideation PDF</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Participant & Institution</p>
            <p className="font-bold text-slate-900 mt-1">Neelaksh Suman</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Swami Keshwanand Institute of Technology Management and Gramothan
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Challenge Category</p>
            <p className="font-bold text-slate-900 mt-1">
              Category II: Diploma & Higher Education
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Individual Entry · Safer Clicks, Smarter Choices
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500">Conceptual Model Implemented</p>
            <p className="font-bold text-slate-900 mt-1">
              01 Learn → 02 Submit → 03 Analyse → 04 Explain
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Rule-based heuristic baseline + server-side Gemini explanation
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
