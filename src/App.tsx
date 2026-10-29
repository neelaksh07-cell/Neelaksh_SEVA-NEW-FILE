/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Menu,
  X,
  AlertCircle,
} from 'lucide-react';
import { HomeDashboard, NavTab } from './components/HomeDashboard';
import { LearnSection } from './components/LearnSection';
import { ScamCheckerSection } from './components/ScamCheckerSection';
import { ScreenshotCheckerSection } from './components/ScreenshotCheckerSection';
import { QrCheckerSection } from './components/QrCheckerSection';
import { PrivacyAndSafetySection } from './components/PrivacyAndSafetySection';
import { LessonProgressMap } from './utils/scamAnalyzer';

const STORAGE_KEY = 'seva_cyberguard_progress_v1';

const DEMO_SAMPLE_PROGRESS: LessonProgressMap = {
  completedLessonIds: ['b-phishing', 'b-links', 'i-support'],
  quizScores: {
    'b-phishing': { score: 2, total: 2 },
    'b-links': { score: 2, total: 2 },
    'i-support': { score: 2, total: 2 },
  },
};

const EMPTY_PROGRESS: LessonProgressMap = {
  completedLessonIds: [],
  quizScores: {},
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [checkerPreloadText, setCheckerPreloadText] = useState<string>('');
  const [isUsingDemoProgress, setIsUsingDemoProgress] = useState<boolean>(true);
  const [progress, setProgress] = useState<LessonProgressMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.completedLessonIds) && parsed.quizScores) {
          return parsed;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return DEMO_SAMPLE_PROGRESS;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setIsUsingDemoProgress(false);
      }
    } catch {
      // Ignore
    }
  }, []);

  const saveUserProgress = (next: LessonProgressMap, isDemo = false) => {
    setProgress(next);
    setIsUsingDemoProgress(isDemo);
    try {
      if (isDemo) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // Ignore localStorage quota issues
    }
  };

  const handleToggleCompleteLesson = (moduleId: string) => {
    const exists = progress.completedLessonIds.includes(moduleId);
    const nextIds = exists
      ? progress.completedLessonIds.filter((id) => id !== moduleId)
      : [...progress.completedLessonIds, moduleId];
    saveUserProgress(
      {
        ...progress,
        completedLessonIds: nextIds,
      },
      false
    );
  };

  const handleUpdateModuleScore = (moduleId: string, score: number, total: number) => {
    const nextCompleted = progress.completedLessonIds.includes(moduleId)
      ? progress.completedLessonIds
      : [...progress.completedLessonIds, moduleId];

    saveUserProgress(
      {
        completedLessonIds: nextCompleted,
        quizScores: {
          ...progress.quizScores,
          [moduleId]: { score, total },
        },
      },
      false
    );
  };

  const handleInspectSimulationInChecker = (simText: string) => {
    setCheckerPreloadText(simText);
    setActiveTab('scam-checker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (tab: NavTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'home', label: 'Dashboard' },
    { id: 'learn', label: 'Learn' },
    { id: 'scam-checker', label: 'Scam Checker' },
    { id: 'screenshot-checker', label: 'Screenshot Checker' },
    { id: 'qr-checker', label: 'QR Checker' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (5 Single-Line Nav Links) — Zone 3 (1 Primary Action) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            SEVA CyberGuard
          </button>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
            aria-label="Primary Navigation"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? 'text-sky-800 font-semibold border-sky-700'
                      : 'text-slate-600 hover:text-slate-900 border-transparent hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary action (plus mobile menu toggle on small screens) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate('privacy')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-teal-700 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Privacy & Safety
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <nav
            className="md:hidden px-4 pt-2 pb-4 bg-white border-b border-slate-200 space-y-1"
            aria-label="Mobile Navigation"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-sky-50 text-sky-900 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Mandatory Educational Guidance Banner */}
      <div className="bg-sky-950 text-sky-50 border-b border-sky-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-teal-400 shrink-0" aria-hidden="true" />
            <p className="font-medium leading-snug">
              This tool provides educational guidance, not a guarantee of scam detection. Verify suspicious requests through official channels.
            </p>
          </div>
          <span className="hidden lg:inline text-sky-300 whitespace-nowrap shrink-0 font-mono">
            Helpline: 1930 · cybercrime.gov.in
          </span>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'home' && (
          <HomeDashboard
            onNavigate={handleNavigate}
            progress={progress}
            isUsingDemoProgress={isUsingDemoProgress}
            onLoadDemoProgress={() => saveUserProgress(DEMO_SAMPLE_PROGRESS, true)}
            onResetProgress={() => saveUserProgress(EMPTY_PROGRESS, false)}
          />
        )}

        {activeTab === 'learn' && (
          <LearnSection
            progress={progress}
            onUpdateModuleScore={handleUpdateModuleScore}
            onToggleCompleteLesson={handleToggleCompleteLesson}
            onInspectSimulationInChecker={handleInspectSimulationInChecker}
          />
        )}

        {activeTab === 'scam-checker' && (
          <ScamCheckerSection initialText={checkerPreloadText} />
        )}

        {activeTab === 'screenshot-checker' && <ScreenshotCheckerSection />}

        {activeTab === 'qr-checker' && <QrCheckerSection />}

        {activeTab === 'privacy' && <PrivacyAndSafetySection />}
      </main>

      {/* Quiet, Honest Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
            <span>
              <strong>SEVA CyberGuard</strong> · Student Innovation Prototype (SEVA First Innovation Challenge 2026 · Neelaksh Suman)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('privacy')}
              className="hover:text-slate-900 underline cursor-pointer"
            >
              Privacy & Safety Policy
            </button>
            <span aria-hidden="true">·</span>
            <span>No Personal Data Stored</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
