import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  EyeOff,
  FileText,
  Beaker,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { analyzeScamContent, ScamAnalysisResult } from '../utils/scamAnalyzer';
import { SAMPLE_SCREENSHOT_SCENARIOS, SampleScreenshotScenario } from '../data/learningContent';
import { RiskResultPanel } from './RiskResultPanel';

/**
 * Runs local browser-based OCR using Tesseract.js with locally served worker,
 * WASM core, and English traineddata assets so uploaded screenshots work even
 * when server-side GEMINI_API_KEY is not configured.
 */
async function runLocalBrowserOcr(dataUrl: string): Promise<string> {
  const worker = await createWorker('eng', 1, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core',
    langPath: '/ocr/lang',
  });
  try {
    const { data } = await worker.recognize(dataUrl);
    return (data?.text || '').trim();
  } finally {
    await worker.terminate();
  }
}

/**
 * Generates a realistic educational SMS/Email screenshot PNG data URL on an HTML5 canvas
 * so users can test the full image upload + OCR + analysis pipeline with 1 click.
 */
function renderSampleScreenshotToDataUrl(scenario: SampleScreenshotScenario): string {
  const canvas = document.createElement('canvas');
  canvas.width = 680;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header bar
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(24, 24, canvas.width - 48, 64);

  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText(`${scenario.channel} • EDUCATIONAL SAMPLE SCREENSHOT`, 44, 50);

  ctx.fillStyle = '#E2E8F0';
  ctx.font = '13px monospace';
  ctx.fillText(`Sender: ${scenario.sender}   |   ${scenario.timestamp}`, 44, 74);

  // Message bubble
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(24, 104, canvas.width - 48, 250);

  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(scenario.subjectOrHeader, 44, 136);

  ctx.font = '15px monospace';
  ctx.fillStyle = '#1E293B';
  scenario.simulatedTextLines.forEach((line, idx) => {
    ctx.fillText(line, 44, 172 + idx * 26);
  });

  return canvas.toDataURL('image/png');
}

export const ScreenshotCheckerSection: React.FC = () => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [visualObservations, setVisualObservations] = useState<string>('');
  const [uncertaintyNote, setUncertaintyNote] = useState<string>('');
  const [ocrStatusNote, setOcrStatusNote] = useState<string>('');
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<ScamAnalysisResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processScreenshotDataUrl = async (
    dataUrl: string,
    mimeType: string,
    label: string,
    fallbackTextForSample = ''
  ) => {
    setErrorMsg('');
    setImagePreviewUrl(dataUrl);
    setImageLabel(label);
    setIsAnalysing(true);
    setVisualObservations('');
    setUncertaintyNote(
      'Static screenshots do not verify sender cryptographic signatures; contact names or headers can be spoofed or edited.'
    );
    setOcrStatusNote('');

    if (fallbackTextForSample) {
      setExtractedText(fallbackTextForSample);
      setAnalysisResult(analyzeScamContent(fallbackTextForSample));
    } else {
      setExtractedText('');
      setAnalysisResult(null);
    }

    try {
      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType,
          fallbackText: fallbackTextForSample,
        }),
      });

      const data = await response.json();
      const serverAvailable = Boolean(data?.available);
      let textFound = typeof data?.extractedText === 'string' ? data.extractedText.trim() : '';
      let statusNote = typeof data?.note === 'string' ? data.note : '';

      // When server-side Gemini Vision OCR reports available: false or returns empty extractedText,
      // run local browser OCR for uploaded screenshots (or fall back to built-in sample text).
      if (!serverAvailable || !textFound) {
        if (!textFound && !fallbackTextForSample) {
          setOcrStatusNote(
            'Server-side Gemini Vision OCR is unavailable; running local browser OCR (Tesseract.js) on your uploaded screenshot...'
          );
          try {
            const localOcrText = await runLocalBrowserOcr(dataUrl);
            if (localOcrText) {
              textFound = localOcrText;
              statusNote =
                'Server-side Gemini Vision OCR is currently unavailable (API key not configured). Visible text was extracted locally in your browser using Tesseract.js OCR for heuristic scam analysis.';
            } else {
              statusNote =
                'Local browser OCR completed but did not detect readable text in this image. You can type or edit the visible text manually below.';
            }
          } catch {
            statusNote =
              'Local browser OCR could not extract text from this image. You can still type or paste the visible text manually below to run heuristic checks.';
          }
        } else if (!textFound && fallbackTextForSample) {
          textFound = fallbackTextForSample.trim();
        }
      }

      setExtractedText(textFound);
      setVisualObservations(data?.visualObservations || '');
      setUncertaintyNote(
        data?.uncertaintyNote ||
          'Static screenshots do not verify sender cryptographic signatures; contact names or headers can be spoofed or edited.'
      );
      if (statusNote) {
        setOcrStatusNote(statusNote);
      }

      if (textFound) {
        const heuristic = analyzeScamContent(textFound);
        if (serverAvailable && data?.visualObservations) {
          heuristic.aiExplanation = {
            available: true,
            source: 'gemini-server',
            plainLanguageBreakdown: data.visualObservations,
            keyTakeaway:
              data.uncertaintyNote ||
              'Never call phone numbers or visit URLs transcribed from an unexpected screenshot without independent verification.',
          };
        } else if (statusNote) {
          heuristic.aiExplanation = {
            available: false,
            source: 'heuristic-only',
            plainLanguageBreakdown: '',
            keyTakeaway: '',
            note: statusNote,
          };
        }
        setAnalysisResult(heuristic);
      } else {
        setAnalysisResult(null);
      }
    } catch {
      if (fallbackTextForSample) {
        setExtractedText(fallbackTextForSample);
        setOcrStatusNote(
          'Server-side Vision OCR was unreachable; using built-in sample transcript for local heuristic demonstration.'
        );
        setAnalysisResult(analyzeScamContent(fallbackTextForSample));
      } else {
        try {
          const localOcrText = await runLocalBrowserOcr(dataUrl);
          if (localOcrText) {
            const note =
              'Server-side Vision OCR was unreachable; visible text was extracted locally in your browser using Tesseract.js OCR.';
            setExtractedText(localOcrText);
            setOcrStatusNote(note);
            const heuristic = analyzeScamContent(localOcrText);
            heuristic.aiExplanation = {
              available: false,
              source: 'heuristic-only',
              plainLanguageBreakdown: '',
              keyTakeaway: '',
              note,
            };
            setAnalysisResult(heuristic);
          } else {
            setErrorMsg(
              'No readable text was detected in the uploaded image. You can type or paste the visible text below to run heuristic checks.'
            );
          }
        } catch {
          setErrorMsg(
            'Could not reach the server-side image OCR service. You can still type or paste the visible text below to run heuristic checks.'
          );
        }
      }
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPEG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image exceeds the 5 MB upload limit. Please crop or compress the screenshot.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      if (resultStr) {
        processScreenshotDataUrl(resultStr, file.type, `Uploaded file: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSampleScreenshot = (scenario: SampleScreenshotScenario) => {
    const dataUrl = renderSampleScreenshotToDataUrl(scenario);
    const fullText = scenario.simulatedTextLines.join('\n');
    processScreenshotDataUrl(
      dataUrl,
      'image/png',
      `${scenario.title} (Sample Data)`,
      fullText
    );
  };

  const handleReanalyseEditedText = () => {
    if (!extractedText.trim()) {
      setErrorMsg('Extracted text box is empty. Enter or extract text first.');
      return;
    }
    setErrorMsg('');
    setAnalysisResult(analyzeScamContent(extractedText));
  };

  const handleReset = () => {
    setImagePreviewUrl(null);
    setImageLabel('');
    setExtractedText('');
    setVisualObservations('');
    setUncertaintyNote('');
    setOcrStatusNote('');
    setErrorMsg('');
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200">
        <p className="text-xs text-slate-500">
          OCR & Visual Warning Sign Extraction · Redact Personal Data Before Uploading
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Suspicious SMS & Email Screenshot Checker
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Upload a screenshot of a suspicious SMS, WhatsApp message, or email—or select a safe educational sample screenshot below. SEVA CyberGuard extracts the visible text, highlights warning signs, and never follows links found inside images.
        </p>
      </div>

      {/* Mandatory Privacy & Redaction Banner */}
      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 flex items-start gap-3">
        <EyeOff className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong>Privacy Reminder — Redact Personal Information First:</strong> Before uploading any real screenshot, crop or blur out your bank account numbers, OTPs, Aadhaar/PAN numbers, and personal names. Uploaded screenshots are processed transiently in memory and are never saved by default.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Upload & Sample Screenshot Selector */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              1. Upload a Redacted Screenshot Image
            </h2>

            <label
              htmlFor="screenshot-file-input"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-sky-600 rounded-xl bg-slate-50/70 hover:bg-sky-50/30 transition-colors cursor-pointer text-center"
            >
              <Upload className="w-7 h-7 text-sky-700 mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-900">
                Choose Screenshot Image (PNG, JPG, WebP)
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Max 5 MB · Processed transiently in memory
              </span>
              <input
                ref={fileInputRef}
                id="screenshot-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2" role="alert">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Preview & Extracted Text Box */}
            {imagePreviewUrl && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {imageLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-slate-600 hover:text-red-700 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear Image</span>
                  </button>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                  <img
                    src={imagePreviewUrl}
                    alt={imageLabel || 'Uploaded suspicious screenshot preview'}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto max-h-60 object-contain mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="ocr-extracted-textarea" className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                      <span>Extracted / Editable Text from Screenshot</span>
                    </label>
                    <span className="text-xs text-slate-500">
                      {isAnalysing ? 'Extracting text...' : 'Editable'}
                    </span>
                  </div>
                  <textarea
                    id="ocr-extracted-textarea"
                    rows={5}
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    placeholder="Extracted text from the screenshot will appear here. You can also edit or type text manually if OCR is unavailable."
                    className="w-full p-3 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-600 focus:outline-none leading-relaxed"
                  />
                  <button
                    type="button"
                    onClick={handleReanalyseEditedText}
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Re-Analyse Extracted Text
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Built-in Sample Screenshots for 1-Click Testing */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-sky-700" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900">
                2. Or Test with Simulated Sample Screenshots (Sample Data)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Click any sample below to generate a simulated screenshot image and inspect its extracted text and warning signs:
            </p>

            <div className="space-y-2.5 pt-1">
              {SAMPLE_SCREENSHOT_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectSampleScreenshot(sc)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-sky-500 hover:bg-sky-50/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{sc.channel}</span>
                    <span className="font-mono">{sc.sender}</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {sc.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-snug">
                    {sc.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="lg:col-span-7 space-y-5">
          {ocrStatusNote && (
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong>OCR Status Notice:</strong> {ocrStatusNote}
            </div>
          )}

          {uncertaintyNote && (
            <div className="p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-950 leading-relaxed">
              <strong>Screenshot Visual Uncertainty:</strong> {uncertaintyNote}
              {visualObservations && (
                <p className="mt-1.5 text-slate-700">{visualObservations}</p>
              )}
            </div>
          )}

          {analysisResult ? (
            <RiskResultPanel
              result={analysisResult}
              isLoadingAi={isAnalysing}
              sourceLabel="Screenshot OCR & Pattern Analysis"
            />
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  No Screenshot Loaded Yet
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload a redacted SMS or email screenshot—or select one of the three simulated sample screenshots on the left—to extract visible text and evaluate warning signs safely.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleSelectSampleScreenshot(SAMPLE_SCREENSHOT_SCENARIOS[0])}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load Sample Screenshot A: Electricity SMS
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
