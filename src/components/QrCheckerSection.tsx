import React, { useState, useRef } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import {
  QrCode,
  Upload,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Beaker,
  Trash2,
  Link2Off,
  IndianRupee,
} from 'lucide-react';
import { analyzeQrPayload, QrAnalysisResult } from '../utils/scamAnalyzer';
import { SAMPLE_QR_SCENARIOS, SampleQrScenario } from '../data/learningContent';
import { getRiskBandVisuals } from './RiskResultPanel';

export const QrCheckerSection: React.FC = () => {
  const [qrImagePreview, setQrImagePreview] = useState<string | null>(null);
  const [qrLabel, setQrLabel] = useState<string>('');
  const [senderClaimContext, setSenderClaimContext] = useState<string>('');
  const [qrAnalysis, setQrAnalysis] = useState<QrAnalysisResult | null>(null);
  const [decodeError, setDecodeError] = useState<string>('');
  const [manualPayloadInput, setManualPayloadInput] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Decodes an image data URL using an offscreen HTML5 Canvas + jsQR pixel inspection.
   */
  const decodeQrFromDataUrl = (dataUrl: string, label: string, claimText = '') => {
    setDecodeError('');
    setQrImagePreview(dataUrl);
    setQrLabel(label);
    setSenderClaimContext(claimText);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 800;
      let width = img.width || 300;
      let height = img.height || 300;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDecodeError(
          'Browser canvas context is unavailable for QR decoding. You can still paste a raw QR text string below to inspect it.'
        );
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        const analysis = analyzeQrPayload(code.data);
        setQrAnalysis(analysis);
        setManualPayloadInput(code.data);
      } else {
        setQrAnalysis(null);
        setDecodeError(
          'Limitation Notice: No standard QR code matrix could be decoded from this image. This can happen if the image is blurry, heavily cropped, low-contrast, or uses a proprietary non-standard barcode. You can try uploading a clearer crop of the QR square or paste the text below.'
        );
      }
    };
    img.onerror = () => {
      setDecodeError('Could not load the selected image file for QR decoding.');
    };
    img.src = dataUrl;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setDecodeError('Please upload a valid image file (PNG, JPG, or WebP) containing a QR code.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      if (resultStr) {
        decodeQrFromDataUrl(resultStr, `Uploaded QR Image: ${file.name}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleQr = async (scenario: SampleQrScenario) => {
    try {
      // Generate a genuine standards-compliant QR image data URL and pass it through the real jsQR decoder
      const dataUrl = await QRCode.toDataURL(scenario.qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF',
        },
      });
      decodeQrFromDataUrl(dataUrl, scenario.title, scenario.claimMadeBySender);
    } catch {
      // Fallback if canvas QR generation fails
      setQrLabel(scenario.title);
      setSenderClaimContext(scenario.claimMadeBySender);
      setQrAnalysis(analyzeQrPayload(scenario.qrPayload));
    }
  };

  const handleInspectManualPayload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayloadInput.trim()) {
      setDecodeError('Please enter a QR payload string or select a sample QR code.');
      return;
    }
    setDecodeError('');
    setQrLabel('Manual QR Payload Inspection');
    setQrAnalysis(analyzeQrPayload(manualPayloadInput.trim()));
  };

  const handleClear = () => {
    setQrImagePreview(null);
    setQrLabel('');
    setSenderClaimContext('');
    setQrAnalysis(null);
    setDecodeError('');
    setManualPayloadInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const visuals = qrAnalysis ? getRiskBandVisuals(qrAnalysis.riskBand) : null;
  const BandIcon = visuals?.Icon || ShieldAlert;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200">
        <p className="text-xs text-slate-500">
          Plain-Text QR Destination Decoder · Zero Auto-Navigation · UPI Collect & Phishing Inspector
        </p>
        <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
          Safe QR-Code Destination Checker
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Upload an image containing a suspicious QR code (such as a “Scan to receive refund” voucher on WhatsApp or a poster sticker). SEVA CyberGuard decodes the hidden text locally and displays the destination as inert plain text—<strong>never</strong> opening links or launching payment apps automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: QR Image Upload & Built-in Samples */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900">
              1. Upload a QR Code Image
            </h2>

            <label
              htmlFor="qr-file-input"
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 hover:border-teal-600 rounded-xl bg-slate-50/70 hover:bg-teal-50/30 transition-colors cursor-pointer text-center"
            >
              <Upload className="w-7 h-7 text-teal-700 mb-2" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-900">
                Select Image Containing a QR Code
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Decoded locally in your browser · Never opened automatically
              </span>
              <input
                ref={fileInputRef}
                id="qr-file-input"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>

            {qrImagePreview && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    {qrLabel}
                  </span>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-xs text-slate-600 hover:text-red-700 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center">
                  <img
                    src={qrImagePreview}
                    alt={qrLabel || 'Uploaded QR code preview'}
                    referrerPolicy="no-referrer"
                    className="w-44 h-44 object-contain rounded-lg border border-slate-200 bg-white p-2"
                  />
                  {senderClaimContext && (
                    <p className="mt-2.5 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center">
                      <strong>Sender’s Claim in Scenario:</strong> {senderClaimContext}
                    </p>
                  )}
                </div>
              </div>
            )}

            {decodeError && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5" role="alert">
                <AlertCircle className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{decodeError}</span>
              </div>
            )}

            {/* Manual / Fallback Payload Inspection */}
            <form onSubmit={handleInspectManualPayload} className="pt-3 border-t border-slate-100 space-y-2">
              <label htmlFor="manual-qr-input" className="text-xs font-semibold text-slate-700 block">
                Decoded or Manual QR String (Plain Text)
              </label>
              <div className="flex gap-2">
                <input
                  id="manual-qr-input"
                  type="text"
                  value={manualPayloadInput}
                  onChange={(e) => setManualPayloadInput(e.target.value)}
                  placeholder="e.g. upi://pay?pa=merchant@okaxis&am=4500"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Inspect Text
                </button>
              </div>
            </form>
          </div>

          {/* Built-in Sample QR Scenarios */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <Beaker className="w-4 h-4 text-teal-700" aria-hidden="true" />
              <h2 className="text-sm font-bold text-slate-900">
                2. Test with Real Sample QR Codes (Sample Data)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Click a sample below to generate a real QR code image, decode its pixels with <code className="font-mono">jsQR</code>, and inspect the hidden payload:
            </p>

            <div className="space-y-2.5 pt-1">
              {SAMPLE_QR_SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleLoadSampleQr(sc)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 hover:border-teal-600 hover:bg-teal-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span>{sc.badgeLabel}</span>
                    <span className="font-mono">Real QR Decode</span>
                  </div>
                  <p className="mt-1 text-xs font-bold text-slate-900">
                    {sc.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600 leading-snug">
                    {sc.contextDescription}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Decoded Destination & Warning Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          {qrAnalysis && visuals ? (
            <div className="space-y-5" data-testid="qr-result-panel">
              {/* Risk Band Card */}
              <div className={`p-6 rounded-xl border ${visuals.containerBg}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <BandIcon className={`w-6 h-6 ${visuals.iconColor} shrink-0`} aria-hidden="true" />
                    <div>
                      <p className="text-xs text-slate-600">
                        QR Payload Type: <strong>{qrAnalysis.payloadType}</strong>
                      </p>
                      <h3 className={`text-xl font-bold tracking-tight ${visuals.headerText}`}>
                        {visuals.statusLabel}
                      </h3>
                    </div>
                  </div>
                </div>
                <p className={`mt-4 text-sm leading-relaxed ${visuals.subText}`}>
                  {qrAnalysis.summary}
                </p>
              </div>

              {/* Plain-Text Destination Inspector (Never Hyperlinked) */}
              <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link2Off className="w-4 h-4 text-slate-700" aria-hidden="true" />
                    <h4 className="text-base font-bold text-slate-900">
                      Decoded Destination (Inert Plain Text)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">Auto-navigation disabled</span>
                </div>
                <p className="text-xs text-slate-500">
                  Below is the exact text string encoded inside the QR code. It is rendered strictly as non-clickable text so you can inspect it safely:
                </p>
                <div
                  className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs break-all select-all"
                  data-testid="qr-decoded-plaintext"
                >
                  {qrAnalysis.decodedText}
                </div>
              </div>

              {/* UPI Payment Breakdown if UPI URI */}
              {qrAnalysis.upiDetails?.isUpiUri && (
                <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-red-700" aria-hidden="true" />
                    <h4 className="text-base font-bold text-slate-900">
                      Decoded UPI Payment Parameters (<code className="font-mono text-sm">upi://pay</code>)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600">
                    This QR code contains a structured UPI payment URI. Here is what each parameter inside the QR code actually instructs your UPI app to do:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Transaction Direction</span>
                      <strong className="text-red-700 font-semibold mt-0.5 block">
                        OUTGOING DEBIT (Sends money FROM your account)
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Pre-filled Amount (am=)</span>
                      <strong className="font-mono text-slate-900 text-sm mt-0.5 block">
                        {qrAnalysis.upiDetails.amount}
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Payee VPA Address (pa=)</span>
                      <strong className="font-mono text-slate-900 mt-0.5 block break-all">
                        {qrAnalysis.upiDetails.payeeAddress}
                      </strong>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Display Name / Note (pn / tn)</span>
                      <strong className="text-slate-900 mt-0.5 block">
                        {qrAnalysis.upiDetails.payeeName} — {qrAnalysis.upiDetails.transactionNote}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning Signs */}
              <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-4">
                <h4 className="text-base font-bold text-slate-900">
                  QR Warning Signs Explained ({qrAnalysis.warningSigns.length})
                </h4>
                {qrAnalysis.warningSigns.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No deceptive UPI payment parameters or high-risk domain patterns were detected in the decoded text. Always confirm the destination belongs to the expected organisation before visiting manually.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {qrAnalysis.warningSigns.map((w, idx) => (
                      <div key={w.id || idx} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-sm font-semibold text-slate-900">
                            {idx + 1}. {w.title}
                          </h5>
                          <span className="text-xs text-slate-500">{w.category}</span>
                        </div>
                        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                          {w.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Safe Next Steps */}
              <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-3">
                <h4 className="text-base font-bold text-slate-900">
                  Safe Next Steps for QR Codes
                </h4>
                <ul className="space-y-2">
                  {qrAnalysis.safeNextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-1" aria-hidden="true" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                <QrCode className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  Ready to Decode & Inspect a QR Code Safely
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload any QR code image on the left—or click one of the three real QR code samples—to decode the hidden destination into plain text without visiting it.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleLoadSampleQr(SAMPLE_QR_SCENARIOS[0])}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Load Sample QR 1: Fake "Scan to Receive ₹4,500" Trap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
