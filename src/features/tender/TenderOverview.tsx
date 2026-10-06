import React, { useRef } from 'react';
import {
  FileText,
  Calendar,
  Building2,
  UserCheck,
  Hash,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Tender, Requirement, Language } from '../../types';
import { Button } from '../../components/ui/Button';
import { getTranslation } from '../i18n/translations';
import { defaultTenderData } from './defaultData';

interface TenderOverviewProps {
  tender: Tender;
  requirements: Requirement[];
  lang: Language;
  onLoadRequirements: (tender: Tender, requirements: Requirement[]) => void;
  matchedCount: number;
  blockingCount: number;
  onShowToast: (msg: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
}

export const TenderOverview: React.FC<TenderOverviewProps> = ({
  tender,
  requirements,
  lang,
  onLoadRequirements,
  matchedCount,
  blockingCount,
  onShowToast,
}) => {
  const t = getTranslation(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mandatoryCount = requirements.filter(r => r.mandatory).length;
  const optionalCount = requirements.length - mandatoryCount;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);

        // Validate structure as per FR-01
        if (!parsed.tender || !parsed.requirements || !Array.isArray(parsed.requirements)) {
          throw new Error('requirements.json must contain "tender" and "requirements" array.');
        }

        const requiredTenderFields = [
          'tender_id',
          'title',
          'procuring_entity',
          'bidder',
          'submission_deadline',
        ];
        for (const field of requiredTenderFields) {
          if (!parsed.tender[field]) {
            throw new Error(`Missing required field in tender object: ${field}`);
          }
        }

        for (const req of parsed.requirements) {
          if (
            !req.id ||
            typeof req.order !== 'number' ||
            !req.title_en ||
            typeof req.mandatory !== 'boolean' ||
            typeof req.has_expiry !== 'boolean'
          ) {
            throw new Error(`Invalid requirement schema in item ${req.id || 'unknown'}`);
          }
        }

        onLoadRequirements(parsed.tender, parsed.requirements);
        onShowToast({
          type: 'success',
          message: `Successfully loaded requirements for tender ${parsed.tender.tender_id}.`,
        });
      } catch (err) {
        onShowToast({
          type: 'error',
          message: err instanceof Error ? err.message : t.errorInvalidJson,
        });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleResetToDefault = () => {
    onLoadRequirements(defaultTenderData.tender, defaultTenderData.requirements);
    onShowToast({
      type: 'info',
      message: t.loadSamplePack + ' loaded.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-border shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            AI DevFest 2026
          </span>
          <h2 className="text-xl font-bold text-text-primary mt-0.5">
            {t.tenderOverviewTitle}
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            {t.loadRequirementsPrompt}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
            id="requirements-file-input"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-4 h-4" />}
          >
            {t.loadRequirements}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetToDefault}
            leftIcon={<RefreshCw className="w-4 h-4" />}
            title="Reset to default sample data"
          >
            {t.loadSamplePack}
          </Button>
        </div>
      </div>

      {/* Metadata Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tender ID */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Hash className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-text-secondary">{t.tenderId}</div>
            <div className="text-sm font-bold text-text-primary mt-0.5 truncate">
              {tender.tender_id}
            </div>
          </div>
        </div>

        {/* Procuring Entity */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-text-secondary">{t.procuringEntity}</div>
            <div className="text-sm font-semibold text-text-primary mt-0.5 truncate" title={tender.procuring_entity}>
              {tender.procuring_entity}
            </div>
          </div>
        </div>

        {/* Bidder */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-text-secondary">{t.bidder}</div>
            <div className="text-sm font-semibold text-text-primary mt-0.5 truncate" title={tender.bidder}>
              {tender.bidder}
            </div>
          </div>
        </div>

        {/* Submission Deadline */}
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-text-secondary">{t.submissionDeadline}</div>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {tender.submission_deadline}
            </div>
          </div>
        </div>
      </div>

      {/* Tender Title Card */}
      <div className="p-4 rounded-xl bg-surface border border-border shadow-sm flex items-start gap-3">
        <div className="p-2 rounded-lg bg-accent/10 text-accent shrink-0 mt-0.5">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t.tenderTitle}
          </div>
          <div className="text-base font-bold text-text-primary mt-0.5">
            {tender.title}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
          <div className="text-xs text-text-secondary font-medium">{t.totalRequirements}</div>
          <div className="text-2xl font-bold text-text-primary mt-1">{requirements.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
          <div className="text-xs text-text-secondary font-medium">{t.mandatoryDocs}</div>
          <div className="text-2xl font-bold text-accent mt-1">{mandatoryCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
          <div className="text-xs text-text-secondary font-medium">{t.optionalDocs}</div>
          <div className="text-2xl font-bold text-text-secondary mt-1">{optionalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-border shadow-sm">
          <div className="text-xs text-text-secondary font-medium">{t.matchedDocs}</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {matchedCount}
            </span>
            <span className="text-xs text-text-secondary">/ {requirements.length}</span>
          </div>
        </div>
      </div>

      {/* Quick Status Notice */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 ${
          blockingCount > 0
            ? 'bg-amber-50/60 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800'
            : 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
        }`}
      >
        {blockingCount > 0 ? (
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          {blockingCount > 0 ? (
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              There are currently <strong>{blockingCount} blocking item(s)</strong> that prevent generating the final tender package. Please upload required files and verify expiry dates in the Requirements section.
            </span>
          ) : (
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">
              All required documents and expiry dates are satisfied! You can proceed to build and download the package in the Package section.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
