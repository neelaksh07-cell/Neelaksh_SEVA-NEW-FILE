import React, { useState, useEffect } from 'react';
import {
  SearchCheck,
  Trash2,
  Beaker,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { analyzeScamContent, ScamAnalysisResult } from '../utils/scamAnalyzer';
import { SAMPLE_SCAM_MESSAGES } from '../data/learningContent';
import { RiskResultPanel } from './RiskResultPanel';

interface ScamCheckerSectionProps {
  initialText?: string;
}

export const ScamCheckerSection: React.FC<ScamCheckerSectionProps> = ({ initialText = '' }) => {
  const [inputText, setInputText] = useState<string>(initialText);
  const [validationError, setValidationError] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ScamAnalysisResult | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [activeSampleLabel, setActiveSampleLabel] = useState<string | null>(null);

  useEffect(() => {
    if (initialText && initialText.trim()) {
      setInputText(initialText);
      setActiveSampleLabel('Educational Simulation from Learn Module');
      runFullAnalysis(initialText);
    }
  }, [initialText]);

  const runFullAnalysis = async (textToAnalyse: string) => {
    const trimmed = textToAnalyse.trim();
    if (!trimmed) {
      setValidationError('Please paste a message, SMS, email excerpt, or URL before clicking Analyse.');
      setAnalysisResult(null);
      return;
    }
    if (trimmed.length < 5) {
      setValidationError('Please enter at least 5 characters (such as a full domain name or message sentence) to run a meaningful check.');
      setAnalysisResult(null);
      return;
    }

    setValidationError('');
    // 1. Run immediate deterministic local heuristic analysis
    const localResult = analyzeScamContent(trimmed);
    setAnalysisResult(localResult);

    // 2. Request server-side Gemini educational explanation (untrusted data boundary)
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      });
      const data = await response.json();

      if (response.ok && data) {
        setAnalysisResult((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            aiExplanation: {
              available: Boolean(data.available),
              source: data.source === 'gemini-server' ? 'gemini-server' : 'heuristic-only',
              plainLanguageBreakdown: data.plainLanguageBreakdown || '',
              keyTakeaway: data.keyTakeaway || '',
              note: data.note,
            },
          };
        });
      }
    } catch {
      setAnalysisResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          aiExplanation: {
            available: false,
            source: 'heuristic-only',
            plainLanguageBreakdown: '',
            keyTakeaway: '',
            note: 'Server-side AI explanation is currently unreachable. Displaying local heuristic pattern analysis.',
          },
        };
      });
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_SCAM_MESSAGES.find((s) => s.id === sampleId);
    if (!found) return;
    setInputText(found.content);
    setActiveSampleLabel(found.label);
    setValidationError('');
    runFullAnalysis(found.content);
  };

  const handleClear = () => {
    setInputText('');
    setValidationError('');
    setAnalysisResult(null);
    setActiveSampleLabel(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200">
        <p className="text-xs text-slate-500">
          Inert Text & URL Inspector · Zero Auto-Navigation · Untrusted Input Sandboxing
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          AI-Assisted Scam Message & URL Checker
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Paste a suspicious SMS, WhatsApp forward, email, or web address below. SEVA CyberGuard inspects visible warning signs (urgency, payment/OTP requests, and domain structure) without ever opening or visiting submitted links.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Input Form & Sample Messages */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runFullAnalysis(inputText);
            }}
            className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="scam-checker-textarea" className="text-sm font-bold text-slate-900">
                Suspicious Message or URL
              </label>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {inputText.length} / 4000 chars
              </span>
            </div>

            {activeSampleLabel && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                <span>
                  <strong>Sample Data Loaded:</strong> {activeSampleLabel}
                </span>
              </div>
            )}

            <textarea
              id="scam-checker-textarea"
              rows={6}
              maxLength={4000}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (activeSampleLabel) setActiveSampleLabel(null);
                if (validationError) setValidationError('');
              }}
              placeholder="Paste suspicious SMS text, WhatsApp message, or URL here (e.g., 'Dear Consumer, your electricity power will be disconnected tonight...')"
              className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-sky-600 focus:outline-none leading-relaxed"
            />

            {validationError && (
              <p className="text-xs font-medium text-red-700" role="alert">
                {validationError}
              </p>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Lock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Privacy & Safety:</strong> Never paste your actual passwords, OTPs, CVVs, or bank account numbers. Submitted text is not saved to any database.
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <SearchCheck className="w-4 h-4" aria-hidden="true" />
                <span>Analyse Content</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Clear</span>
              </button>
            </div>
          </form>

          {/* Safe Sample Messages for Demonstration */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900">
                Try Safe Educational Sample Messages (Sample Data)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Click any sample below to load and inspect how SEVA CyberGuard explains different risk bands:
            </p>

            <div className="space-y-2 pt-1">
              {SAMPLE_SCAM_MESSAGES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample.id)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{sample.category}</span>
                    <span className="font-mono">{sample.expectedBand}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-900">
                    {sample.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-7">
          {analysisResult ? (
            <RiskResultPanel
              result={analysisResult}
              isLoadingAi={isLoadingAi}
              sourceLabel={activeSampleLabel ? 'Sample Demonstration Analysis' : 'Message & URL Analysis'}
            />
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  Ready to Inspect Suspicious Text or Links
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Paste any SMS, WhatsApp forward, email, or link on the left—or click one of the labelled sample messages—to see a cautious risk assessment, plain-language warning sign explanations, and safe next steps.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample(SAMPLE_SCAM_MESSAGES[0].id)}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load Sample 1: Fake Electricity Bill SMS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
