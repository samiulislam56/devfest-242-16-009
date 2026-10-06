import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Package,
  Download,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Sparkles,
  ExternalLink,
  Eye,
} from 'lucide-react';
import {
  Tender,
  RequirementValidationResult,
  Language,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { getTranslation } from '../i18n/translations';
import {
  generateTenderPackage,
  downloadGeneratedPDF,
  PDFGenerationProgress,
} from '../../lib/pdf/pdfGenerator';

interface PackageGeneratorProps {
  tender: Tender;
  validationResults: RequirementValidationResult[];
  hasBlockingIssues: boolean;
  lang: Language;
  onShowToast: (msg: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
  sealImageBytes?: Uint8Array;
  sealApplyTo?: 'all' | 'last' | 'cover';
}

export const PackageGenerator: React.FC<PackageGeneratorProps> = ({
  tender,
  validationResults,
  hasBlockingIssues,
  lang,
  onShowToast,
  sealImageBytes,
  sealApplyTo,
}) => {
  const t = getTranslation(lang);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<PDFGenerationProgress | null>(null);
  const [generatedPdfData, setGeneratedPdfData] = useState<{
    bytes: Uint8Array;
    fileName: string;
    totalPages: number;
    objectUrl: string;
  } | null>(null);

  const matchedDocs = validationResults.filter(r => r.matchedFile);
  const blockingIssues = validationResults.filter(r => r.isBlocking);

  const handleGenerate = async () => {
    if (hasBlockingIssues) {
      onShowToast({
        type: 'error',
        message: t.cannotGenerateReason,
      });
      return;
    }

    if (matchedDocs.length === 0) {
      onShowToast({
        type: 'warning',
        message: 'No documents have been matched yet. Please match documents before generating.',
      });
      return;
    }

    setIsGenerating(true);
    setProgress({ currentStep: 'Starting package generation...', percent: 5 });

    try {
      const result = await generateTenderPackage(tender, validationResults, {
        sealImageBytes,
        sealApplyTo,
        onProgress: prog => {
          setProgress(prog);
        },
      });

      const blob = new Blob([result.pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(blob);

      setGeneratedPdfData({
        bytes: result.pdfBytes,
        fileName: result.fileName,
        totalPages: result.totalPages,
        objectUrl,
      });

      // Celebration effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      onShowToast({
        type: 'success',
        message: `${t.successGenerated} Output ready as ${result.fileName}.`,
      });
    } catch (err) {
      console.error('PDF Generation Error:', err);
      onShowToast({
        type: 'error',
        message: `Package generation failed: ${err instanceof Error ? err.message : 'Unknown error'}. All matched files remain safe.`,
      });
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  const handleDownload = () => {
    if (!generatedPdfData) return;
    downloadGeneratedPDF(generatedPdfData.bytes, generatedPdfData.fileName);
    onShowToast({
      type: 'info',
      message: `Downloaded ${generatedPdfData.fileName}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Primary Builder Card */}
      <div className="p-6 rounded-xl bg-surface border border-border shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              <span>{t.packagePanelTitle}</span>
            </h2>
            <p className="text-xs text-text-secondary mt-1">
              {t.packagePanelDesc}
            </p>
          </div>

          <div className="text-xs bg-surface-raised px-3 py-1.5 rounded-lg border border-border">
            <span className="text-text-secondary">{t.outputFilenameLabel} </span>
            <strong className="font-mono text-accent">{tender.tender_id}_Package.pdf</strong>
          </div>
        </div>

        {/* Specifications List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-lg bg-surface-raised border border-border text-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-text-primary">Official English Cover Page (Page 1)</strong>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Contains tender ID, title, procuring entity, bidder name, deadline, generation timestamp, and full Table of Contents.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-text-primary">Strict Order & Source Fidelity</strong>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Appends documents strictly ordered by requirement <code className="font-mono">order</code> field with original pages intact.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-text-primary">Standard Safety Footers</strong>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Stamps <code className="font-mono">{tender.tender_id} | Page X of Y</code> on every single page without obscuring source content.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-text-primary">Client-Side High Performance</strong>
              <p className="text-text-secondary text-[11px] mt-0.5">
                Processed entirely within your browser using <code className="font-mono">pdf-lib</code>. No documents are uploaded to any server.
              </p>
            </div>
          </div>
        </div>

        {/* Generation Progress Bar */}
        {isGenerating && progress && (
          <div className="p-4 rounded-lg bg-accent-subtle border border-accent/20 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{progress.currentStep}</span>
              </span>
              <span className="font-bold font-mono text-accent">{progress.percent}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-accent/20 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Blocking Warning Alert if blocked */}
        {hasBlockingIssues && (
          <div className="p-4 rounded-lg bg-red-50/80 border border-red-300 dark:bg-red-950/40 dark:border-red-800 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold text-red-900 dark:text-red-200">
                Package generation is currently blocked ({blockingIssues.length} issues)
              </strong>
              <p className="text-red-800 dark:text-red-300 mt-0.5 leading-relaxed">
                Per contest rules (FR-11), you cannot generate the package until all mandatory documents are matched, all expiry dates are on/after the deadline, and all duplicate conflicts are resolved.
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={hasBlockingIssues || isGenerating || matchedDocs.length === 0}
            isLoading={isGenerating}
            leftIcon={<Package className="w-5 h-5" />}
          >
            {isGenerating ? t.generatingProgress : t.generateButton}
          </Button>

          {generatedPdfData && (
            <Button
              variant="success"
              size="lg"
              onClick={handleDownload}
              leftIcon={<Download className="w-5 h-5" />}
            >
              {t.downloadReadyButton} ({generatedPdfData.totalPages} pages)
            </Button>
          )}
        </div>
      </div>

      {/* Generated Result & In-browser PDF Preview */}
      {generatedPdfData && (
        <div className="p-6 rounded-xl bg-surface border border-emerald-500/40 shadow-lg space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  Ready: {generatedPdfData.fileName}
                </h3>
                <p className="text-xs text-text-secondary">
                  Total {generatedPdfData.totalPages} pages (Page 1 Cover + {generatedPdfData.totalPages - 1} Document pages)
                </p>
              </div>
            </div>

            <Button
              variant="success"
              size="md"
              onClick={handleDownload}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {t.downloadReadyButton}
            </Button>
          </div>

          {/* Embedded PDF Viewer */}
          <div className="rounded-xl border border-border overflow-hidden bg-slate-900/10 dark:bg-black/50">
            <div className="p-2.5 bg-surface-raised border-b border-border text-xs flex items-center justify-between text-text-secondary">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-accent" />
                <span>Live Interactive PDF Inspection</span>
              </div>
              <a
                href={generatedPdfData.objectUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent hover:underline font-medium"
              >
                <span>Open in Full Browser Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <iframe
              src={generatedPdfData.objectUrl}
              title="Generated Tender Package PDF"
              className="w-full h-[650px] bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
};
