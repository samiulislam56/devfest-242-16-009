import {
  ShieldAlert,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { RequirementValidationResult, Language } from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { getTranslation } from '../i18n/translations';

interface ValidationPanelProps {
  validationResults: RequirementValidationResult[];
  hasBlockingIssues: boolean;
  duplicateGroupConflicts: Record<string, string>;
  submissionDeadline: string;
  lang: Language;
  onNavigateTo: (section: 'requirements' | 'files' | 'package') => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  validationResults,
  hasBlockingIssues,
  duplicateGroupConflicts,
  submissionDeadline,
  lang,
  onNavigateTo,
}) => {
  const t = getTranslation(lang);

  const blockingIssues = validationResults.filter(r => r.isBlocking);
  const nonBlockingNotices = validationResults.filter(
    r => !r.isBlocking && (r.status === 'NOT_PROVIDED' || r.status === 'OK')
  );

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div
        className={`p-5 rounded-xl border shadow-sm flex items-start gap-4 ${
          hasBlockingIssues
            ? 'bg-red-50/70 border-red-200 dark:bg-red-950/30 dark:border-red-900/50'
            : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'
        }`}
      >
        <div
          className={`p-3 rounded-lg shrink-0 ${
            hasBlockingIssues
              ? 'bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {hasBlockingIssues ? (
            <ShieldAlert className="w-6 h-6" />
          ) : (
            <ShieldCheck className="w-6 h-6" />
          )}
        </div>

        <div className="flex-1">
          <h2
            className={`text-base font-bold ${
              hasBlockingIssues
                ? 'text-red-900 dark:text-red-200'
                : 'text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {hasBlockingIssues
              ? `${blockingIssues.length} Blocking Issue${blockingIssues.length > 1 ? 's' : ''} Must Be Resolved`
              : t.validationAllClear}
          </h2>
          <p
            className={`text-xs mt-1 leading-relaxed ${
              hasBlockingIssues
                ? 'text-red-700 dark:text-red-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {hasBlockingIssues
              ? t.cannotGenerateReason
              : 'All mandatory documents have been matched with valid expiry dates. Package builder is unlocked and ready.'}
          </p>

          <div className="mt-3 flex items-center gap-2">
            {hasBlockingIssues ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => onNavigateTo('requirements')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Go to Requirements Table to Fix
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                onClick={() => onNavigateTo('package')}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Proceed to Package Assembly
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Content Conflicts Notice */}
      {Object.keys(duplicateGroupConflicts).length > 0 && (
        <div className="p-5 rounded-xl bg-amber-50/80 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <AlertOctagon className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{t.duplicateConflictTitle} (FR-10 Violation)</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Per FR-10, identical document contents (detected via SHA-256 hash) cannot be used to satisfy multiple different requirements, even if their filenames differ.
          </p>
          <div className="space-y-1.5 pt-1">
            {Object.entries(duplicateGroupConflicts).map(([rId, msg]) => (
              <div
                key={rId}
                className="text-xs bg-surface p-2.5 rounded-lg border border-border flex items-center justify-between"
              >
                <div className="font-semibold text-text-primary">
                  Requirement {rId}: <span className="font-normal text-text-secondary">{msg}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigateTo('requirements')}
                >
                  {t.resolveAction}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocking Issues Breakdown List */}
      {blockingIssues.length > 0 && (
        <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{t.blockingIssuesTitle} ({blockingIssues.length})</span>
            </h3>
          </div>

          <div className="divide-y divide-border border rounded-lg overflow-hidden">
            {blockingIssues.map(issue => {
              const req = issue.requirement;
              const title = lang === 'bn' ? req.title_bn : req.title_en;
              return (
                <div
                  key={req.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/10 dark:bg-red-950/10"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold bg-surface-raised px-1.5 py-0.5 rounded border border-border">
                        {req.id}
                      </span>
                      <span className="text-xs font-bold text-text-primary">
                        {title}
                      </span>
                      <StatusBadge status={issue.status} lang={lang} />
                    </div>

                    <div className="text-[11px] text-text-secondary">
                      {issue.status === 'MISSING' && (
                        <span>Mandatory document is missing a matched PDF file.</span>
                      )}
                      {issue.status === 'EXPIRY_NEEDED' && (
                        <span>Matched to {issue.matchedFile?.name}, but requires an expiry date.</span>
                      )}
                      {issue.status === 'EXPIRED' && (
                        <span>
                          Document expired on <strong>{issue.expiryDate}</strong> prior to deadline (<strong>{submissionDeadline}</strong>).
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateTo('requirements')}
                    className="self-start sm:self-center text-xs"
                  >
                    Fix in Table
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Non-Blocking Requirements Status */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{t.nonBlockingIssuesTitle} ({nonBlockingNotices.length})</span>
        </h3>

        <div className="divide-y divide-border border rounded-lg overflow-hidden">
          {nonBlockingNotices.map(item => {
            const req = item.requirement;
            const title = lang === 'bn' ? req.title_bn : req.title_en;
            return (
              <div
                key={req.id}
                className="p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] text-text-secondary bg-surface-raised px-1.5 py-0.5 rounded border border-border">
                    {req.id}
                  </span>
                  <span className="font-semibold text-text-primary">{title}</span>
                  {item.matchedFile && (
                    <span className="text-text-secondary text-[11px] hidden sm:inline">
                      ({item.matchedFile.name})
                    </span>
                  )}
                </div>
                <StatusBadge status={item.status} lang={lang} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
