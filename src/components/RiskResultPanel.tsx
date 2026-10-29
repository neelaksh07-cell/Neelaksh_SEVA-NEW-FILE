import React from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Info,
  CheckCircle2,
  Link2Off,
  Sparkles,
  FileWarning,
} from 'lucide-react';
import { ScamAnalysisResult, RiskBand } from '../utils/scamAnalyzer';

interface RiskResultPanelProps {
  result: ScamAnalysisResult;
  isLoadingAi?: boolean;
  sourceLabel?: string;
}

export function getRiskBandVisuals(band: RiskBand) {
  switch (band) {
    case 'High concern':
      return {
        containerBg: 'bg-red-50/80 border-red-200',
        headerText: 'text-red-900',
        subText: 'text-red-800',
        iconColor: 'text-red-700',
        Icon: ShieldAlert,
        statusLabel: 'High concern — Multiple scam warning signs detected',
      };
    case 'Suspicious':
      return {
        containerBg: 'bg-amber-50/80 border-amber-200',
        headerText: 'text-amber-950',
        subText: 'text-amber-900',
        iconColor: 'text-amber-700',
        Icon: AlertTriangle,
        statusLabel: 'Suspicious — Caution and independent verification advised',
      };
    case 'Lower concern':
    default:
      return {
        containerBg: 'bg-teal-50/70 border-teal-200',
        headerText: 'text-teal-950',
        subText: 'text-teal-900',
        iconColor: 'text-teal-700',
        Icon: ShieldCheck,
        statusLabel: 'Lower concern — No obvious high-pressure or phishing patterns detected',
      };
  }
}

export const RiskResultPanel: React.FC<RiskResultPanelProps> = ({
  result,
  isLoadingAi = false,
  sourceLabel = 'Submitted Content Analysis',
}) => {
  const visuals = getRiskBandVisuals(result.riskBand);
  const BandIcon = visuals.Icon;

  return (
    <div className="space-y-6" data-testid="risk-result-panel">
      {/* PII Redaction Alert if detected */}
      {result.containsPotentialPii && result.piiWarning && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Personal Identifier Pattern Detected</p>
            <p className="mt-1 text-amber-900">{result.piiWarning}</p>
          </div>
        </div>
      )}

      {/* Primary Cautious Risk Assessment Card */}
      <div className={`p-6 rounded-xl border ${visuals.containerBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/70">
          <div className="flex items-center gap-3">
            <BandIcon className={`w-6 h-6 ${visuals.iconColor} shrink-0`} aria-hidden="true" />
            <div>
              <p className="text-xs text-slate-600">
                {sourceLabel} · Cautious Risk Band
              </p>
              <h3 className={`text-xl font-bold tracking-tight ${visuals.headerText}`}>
                {visuals.statusLabel}
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
            {result.warningSigns.length} warning sign{result.warningSigns.length === 1 ? '' : 's'} flagged
          </span>
        </div>

        <p className={`mt-4 text-sm leading-relaxed ${visuals.subText}`}>
          {result.summary}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs text-slate-600 space-y-1">
          <p>
            <strong>Non-Guarantee Notice:</strong> {result.uncertaintyNotice}
          </p>
          <p>
            <strong>Reputation Lookup Status:</strong> {result.reputationServiceNotice}
          </p>
        </div>
      </div>

      {/* AI-Assisted Plain Language Explanation */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-slate-900">
              AI-Assisted Educational Explanation
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {isLoadingAi
              ? 'Analysing wording...'
              : result.aiExplanation?.available
              ? 'Server-Side Gemini Analysis'
              : 'Rule-Based Heuristic Mode'}
          </span>
        </div>

        {isLoadingAi ? (
          <div className="py-4 space-y-2 animate-pulse">
            <div className="h-3.5 bg-slate-200 rounded w-5/6"></div>
            <div className="h-3.5 bg-slate-200 rounded w-4/6"></div>
          </div>
        ) : result.aiExplanation?.available ? (
          <div className="mt-3 space-y-3 text-sm text-slate-700 leading-relaxed">
            <p>{result.aiExplanation.plainLanguageBreakdown}</p>
            {result.aiExplanation.keyTakeaway && (
              <div className="p-3 rounded-lg bg-sky-50/70 border border-sky-100 text-sky-950 text-xs">
                <strong>Key Safety Takeaway:</strong> {result.aiExplanation.keyTakeaway}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3 text-xs text-slate-600 leading-relaxed space-y-2">
            <p>
              {result.aiExplanation?.note ||
                'Showing deterministic rule-based heuristic analysis. Submitted content is evaluated locally and never executed.'}
            </p>
          </div>
        )}
      </div>

      {/* Warning Signs Breakdown */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <h4 className="text-base font-semibold text-slate-900">
          Visible Warning Signs Explained ({result.warningSigns.length})
        </h4>
        <p className="text-xs text-slate-500 mt-1">
          Each indicator below explains why scammers use this pattern and how to interpret it safely.
        </p>

        {result.warningSigns.length === 0 ? (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-sm text-slate-700">
            No specific high-pressure keywords, credential demands, or deceptive URL patterns were triggered by the heuristic rules. Still, always verify unexpected requests through official channels before acting.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {result.warningSigns.map((sign, idx) => (
              <div key={sign.id || idx} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-slate-900">
                    {idx + 1}. {sign.title}
                  </h5>
                  <span className="text-xs text-slate-500">
                    {sign.category} · {sign.severity === 'high' ? 'High-risk signal' : sign.severity === 'medium' ? 'Moderate signal' : 'Advisory'}
                  </span>
                </div>
                {sign.matchedText && (
                  <div className="mt-1.5">
                    <span className="text-xs text-slate-500 mr-2">Matched pattern:</span>
                    <code className="text-xs font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded break-all">
                      {sign.matchedText}
                    </code>
                  </div>
                )}
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {sign.explanation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inert URL Inspection (Never Visited or Hyperlinked) */}
      {result.extractedUrls.length > 0 && (
        <div className="p-6 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <Link2Off className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />
            <h4 className="text-base font-semibold text-slate-900">
              Inert Link & Domain Inspection ({result.extractedUrls.length})
            </h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Links are displayed strictly as non-clickable plain text so you cannot open them accidentally. SEVA CyberGuard never visits or executes submitted URLs.
          </p>

          <div className="mt-4 space-y-3">
            {result.extractedUrls.map((u, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    Detected Domain: <strong className="font-mono text-slate-900">{u.hostname}</strong>
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    Protocol: {u.protocol}
                  </span>
                </div>
                <div className="mt-2 p-2.5 rounded bg-slate-100 border border-slate-200/80 font-mono text-xs text-slate-800 break-all select-all">
                  {u.rawUrl}
                </div>
                <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                  {u.notes.map((n, nIdx) => (
                    <li key={nIdx} className="flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safe Next Steps */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white">
        <h4 className="text-base font-semibold text-slate-900">
          Recommended Safe Next Steps
        </h4>
        <ul className="mt-3 space-y-2.5">
          {result.safeNextSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-1" aria-hidden="true" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
