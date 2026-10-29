import React from 'react';
import {
  BookOpen,
  SearchCheck,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Beaker,
  FileText,
  PhoneCall,
} from 'lucide-react';
import { LessonProgressMap, calculateProgressSummary } from '../utils/scamAnalyzer';
import { LEARNING_MODULES } from '../data/learningContent';

export type NavTab = 'home' | 'learn' | 'scam-checker' | 'screenshot-checker' | 'qr-checker' | 'privacy';

interface HomeDashboardProps {
  onNavigate: (tab: NavTab) => void;
  progress: LessonProgressMap;
  isUsingDemoProgress: boolean;
  onLoadDemoProgress: () => void;
  onResetProgress: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  progress,
  isUsingDemoProgress,
  onLoadDemoProgress,
  onResetProgress,
}) => {
  const stats = calculateProgressSummary(progress, LEARNING_MODULES.length);

  return (
    <div className="space-y-8">
      {/* Hero & Progress Sibling Cards (Single-Elevation Depth) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Sibling Card: Welcome & Safety Reminder */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium text-sky-800">
              SEVA First Innovation Challenge 2026 · Student Innovation Prototype · India Cyber Safety
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight" style={{ textWrap: 'balance' }}>
              Learn to spot cyber scam warning signs and inspect suspicious content safely.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              SEVA CyberGuard combines structured scenario-based training with a cautious, explainable checker for suspicious SMS messages, URLs, screenshots, and QR codes—without ever opening or executing untrusted links.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <strong className="text-sky-900">Safety Reminder:</strong> Banks, UPI apps, electricity boards, and government officials in India will <strong>never</strong> ask for your OTP, UPI PIN, CVV, or ask you to install screen-sharing apps like AnyDesk or conduct a “Digital Arrest” on video calls.
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className="px-4 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Start Learning Path</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('scam-checker')}
              className="px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Check a Suspicious Message or URL
            </button>
          </div>
        </div>

        {/* Right Sibling Card: Progress Summary */}
        <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-5">
          <div className="space-y-1 pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Your Local Learning Progress
              </h2>
              <span className="text-xs text-slate-500">
                {isUsingDemoProgress ? 'Sample Data Active' : 'Browser Local Storage'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              No sign-in or personal information is collected.
            </p>
            {isUsingDemoProgress && (
              <p className="pt-1.5 text-xs text-amber-800">
                <strong>Sample Data Notice:</strong> Currently showing pre-filled sample progress for prototype demonstration.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 py-1 divide-x divide-slate-100">
            <div className="pr-2">
              <p className="text-xs text-slate-500">Lessons Completed</p>
              <p className="mt-1 text-3xl font-bold font-mono tabular-nums text-slate-900">
                {stats.completedCount} / {stats.totalLessons}
              </p>
              <p className="mt-1 text-xs text-teal-700 font-mono tabular-nums">
                {stats.completionPercentage}% curriculum finished
              </p>
            </div>

            <div className="pl-6">
              <p className="text-xs text-slate-500">Quiz Score Summary</p>
              <p className="mt-1 text-3xl font-bold font-mono tabular-nums text-slate-900">
                {stats.totalQuizQuestionsAnswered > 0
                  ? `${stats.averageQuizPercentage}%`
                  : '0%'}
              </p>
              <p className="mt-1 text-xs text-slate-600 font-mono tabular-nums">
                {stats.totalQuizCorrect} / {stats.totalQuizQuestionsAnswered} correct answers
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-mono tabular-nums">
              <span>Overall Module Completion</span>
              <span>{stats.completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-600 transition-transform duration-200 origin-left"
                style={{ transform: `scaleX(${Math.min(1, stats.completionPercentage / 100)})` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100">
            {!isUsingDemoProgress ? (
              <button
                type="button"
                onClick={onLoadDemoProgress}
                className="text-xs font-medium text-sky-800 hover:text-sky-950 flex items-center gap-1.5 cursor-pointer"
              >
                <Beaker className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Load Sample Demo Progress (Sample Data)</span>
              </button>
            ) : (
              <span className="text-xs text-amber-800 font-medium">
                Viewing Sample Progress Data
              </span>
            )}

            <button
              type="button"
              onClick={onResetProgress}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Progress</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Core Tool Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              01. Core Learning & Safe Checking Workflow
            </h2>
            <p className="text-sm text-slate-600">
              Four integrated tools following the SEVA conceptual workflow: Learn · Submit · Analyse · Explain.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Learn */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs text-slate-500">
                Beginner · Intermediate · Advanced
              </p>
              <h3 className="text-lg font-bold text-slate-900">
                Learn & Practice Quizzes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Interactive lessons on phishing, fake support calls, UPI traps, impersonation, lookalike links, and QR-code risks with simulated examples.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('learn')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Open Learning Modules</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Card 2: Scam Checker */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <SearchCheck className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs text-slate-500">
                SMS · WhatsApp · Email · URLs
              </p>
              <h3 className="text-lg font-bold text-slate-900">
                Scam & URL Checker
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Paste a suspicious message or web link to inspect urgency tactics, credential requests, and lookalike domain patterns without visiting the link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('scam-checker')}
              className="w-full py-2.5 px-4 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Open Scam Checker</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Card 3: Screenshot Checker */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700">
                <ImageIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs text-slate-500">
                OCR Extraction · Redaction First
              </p>
              <h3 className="text-lg font-bold text-slate-900">
                Screenshot Checker
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Upload a redacted screenshot of a suspicious SMS or email (or test built-in samples) to extract visible text and explain warning signs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('screenshot-checker')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Open Screenshot Checker</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Card 4: QR Checker */}
          <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                <QrCode className="w-5 h-5" aria-hidden="true" />
              </div>
              <p className="text-xs text-slate-500">
                Safe Plain-Text Decode · UPI Check
              </p>
              <h3 className="text-lg font-bold text-slate-900">
                QR-Code Checker
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Decode a QR code image into plain text to check if it hides an outgoing <code className="font-mono">upi://pay</code> debit request or phishing URL—never opening it automatically.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('qr-checker')}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <span>Open QR Checker</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Community Context & Official National Baseline (from attached SEVA Ideation PDF) */}
      <section className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-3">
            <p className="text-xs text-slate-500">
              02. Problem Statement & Community Focus · SEVA First Innovation Challenge 2026
            </p>
            <h2 className="text-xl font-bold text-slate-900">
              Why Integrated Learning and Explainable Checking Matter in India
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Across India—in homes, colleges, workplaces, and small shops—teenagers, working adults, parents, and senior citizens regularly encounter SMS alerts, links, and QR codes that imitate trusted organisations. Standalone URL checkers often return a cryptic red/green score without teaching the user <em>why</em> a message is risky.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <span>
                <strong>Participant:</strong> Neelaksh Suman
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong>Institution:</strong> Swami Keshwanand Institute of Technology Management and Gramothan
              </span>
              <span aria-hidden="true">·</span>
              <span>
                <strong>Category II:</strong> Diploma & Higher Education (Individual Entry)
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Calendar Year 2025 Complaints</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                24,02,579
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-snug">
                Financial cyber-fraud complaints reported nationwide (Source: MHA / I4C, NCRP & CFCFRMS).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Calendar Year 2025 Reported Losses</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                ₹22,495 Cr
              </p>
              <p className="mt-1 text-xs text-slate-600 leading-snug">
                Reported financial cyber-fraud losses in CY 2025 across India (Source: MHA / I4C).
              </p>
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-teal-50/70 border border-teal-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-teal-800 shrink-0" aria-hidden="true" />
                <div className="text-xs text-teal-950">
                  <strong>Official Cyber Crime Helpline (India):</strong> Dial <span className="font-mono font-bold">1930</span> or report at <span className="font-mono">cybercrime.gov.in</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('privacy')}
                className="text-xs font-semibold text-teal-900 underline hover:text-teal-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Privacy & Brief
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
