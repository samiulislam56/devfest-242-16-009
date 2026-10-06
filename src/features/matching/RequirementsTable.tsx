import React from 'react';
import {
  FileText,
  Calendar,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  Requirement,
  UploadedFile,
  Language,
  RequirementValidationResult,
} from '../../types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { getTranslation } from '../i18n/translations';

interface RequirementsTableProps {
  requirements: Requirement[];
  uploadedFiles: UploadedFile[];
  validationResults: RequirementValidationResult[];
  matchedFileIds: Record<string, string | undefined>; // reqId -> fileId
  expiryDates: Record<string, string | undefined>; // reqId -> YYYY-MM-DD
  submissionDeadline: string;
  lang: Language;
  onMatchChange: (requirementId: string, fileId: string | undefined) => void;
  onExpiryChange: (requirementId: string, expiryDate: string) => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
}

export const RequirementsTable: React.FC<RequirementsTableProps> = ({
  requirements,
  uploadedFiles,
  validationResults,
  matchedFileIds,
  expiryDates,
  submissionDeadline,
  lang,
  onMatchChange,
  onExpiryChange,
  onShowToast,
}) => {
  const t = getTranslation(lang);

  // Map validation result by requirementId for quick lookup
  const validationMap = new Map(validationResults.map(r => [r.requirement.id, r]));

  // Get set of file IDs already matched to ANY other requirement
  const getAssignedReqIdForFile = (fileId: string): string | undefined => {
    for (const [rId, fId] of Object.entries(matchedFileIds)) {
      if (fId === fileId) return rId;
    }
    return undefined;
  };

  const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order);

  return (
    <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-text-primary">
            {t.requirementsTableTitle}
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t.requirementsSubtitle}
          </p>
        </div>
        <div className="text-xs text-text-secondary">
          Deadline: <strong className="text-amber-600 dark:text-amber-400 font-bold">{submissionDeadline}</strong>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-xs" aria-label="Requirements and Document Matching">
          <thead className="bg-surface-raised text-text-secondary font-semibold uppercase tracking-wider border-b border-border">
            <tr>
              <th scope="col" className="p-3 w-12 text-center">
                {t.tableColOrder}
              </th>
              <th scope="col" className="p-3 min-w-[200px]">
                {t.tableColRequirement}
              </th>
              <th scope="col" className="p-3 w-24">
                {t.tableColMandatory}
              </th>
              <th scope="col" className="p-3 min-w-[240px]">
                {t.tableColMatchedFile}
              </th>
              <th scope="col" className="p-3 min-w-[160px]">
                {t.tableColExpiryDate}
              </th>
              <th scope="col" className="p-3 min-w-[150px]">
                {t.tableColStatus}
              </th>
              <th scope="col" className="p-3 w-20 text-center">
                {t.tableColActions}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {sortedRequirements.map(req => {
              const currentFileId = matchedFileIds[req.id];
              const currentExpiry = expiryDates[req.id] || '';
              const valResult = validationMap.get(req.id);
              const status = valResult ? valResult.status : 'MISSING';
              const matchedFile = uploadedFiles.find(f => f.id === currentFileId);
              const dupWarning = valResult?.duplicateWarning;

              const title = lang === 'bn' ? req.title_bn : req.title_en;

              return (
                <tr
                  key={req.id}
                  className={`hover:bg-surface-raised/30 transition-colors ${
                    dupWarning
                      ? 'bg-amber-50/50 dark:bg-amber-950/20'
                      : valResult?.isBlocking
                      ? 'bg-red-50/20 dark:bg-red-950/10'
                      : ''
                  }`}
                >
                  {/* Order */}
                  <td className="p-3 text-center font-bold text-text-secondary">
                    {req.order}
                  </td>

                  {/* Requirement Title & ID */}
                  <td className="p-3">
                    <div className="font-semibold text-text-primary text-xs flex items-center gap-1.5">
                      <span>{title}</span>
                      <span className="text-[10px] font-mono text-text-secondary bg-surface-raised px-1 py-0.5 rounded border border-border">
                        {req.id}
                      </span>
                    </div>
                    {req.has_expiry && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>Requires valid expiry on or after deadline</span>
                      </div>
                    )}
                    {dupWarning && (
                      <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1 mt-1 bg-amber-100/70 dark:bg-amber-950/70 p-1.5 rounded border border-amber-300 dark:border-amber-700">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{dupWarning}</span>
                      </div>
                    )}
                  </td>

                  {/* Mandatory / Optional Badge */}
                  <td className="p-3">
                    {req.mandatory ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {t.mandatoryBadge}
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {t.optionalBadge}
                      </span>
                    )}
                  </td>

                  {/* Matched PDF Select Dropdown */}
                  <td className="p-3">
                    <div className="space-y-1">
                      <label htmlFor={`select-file-${req.id}`} className="sr-only">
                        Match PDF for {title}
                      </label>
                      <select
                        id={`select-file-${req.id}`}
                        value={currentFileId || ''}
                        onChange={e => {
                          const newFId = e.target.value || undefined;
                          onMatchChange(req.id, newFId);
                          if (newFId) {
                            onShowToast({
                              type: 'success',
                              message: `${title} matched to file.`,
                            });
                          }
                        }}
                        className={`w-full text-xs rounded-lg border bg-surface px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                          currentFileId
                            ? 'border-accent/50 font-medium'
                            : 'border-border text-text-secondary'
                        }`}
                      >
                        <option value="">{t.selectFilePlaceholder}</option>
                        {uploadedFiles.map(f => {
                          const assignedToReq = getAssignedReqIdForFile(f.id);
                          const isAssignedOther =
                            Boolean(assignedToReq && assignedToReq !== req.id);

                          return (
                            <option
                              key={f.id}
                              value={f.id}
                              disabled={isAssignedOther}
                            >
                              {f.name} ({f.pageCount}p)
                              {isAssignedOther ? ` [Matched to ${assignedToReq}]` : ''}
                              {f.isDuplicate ? ' [Duplicate content]' : ''}
                            </option>
                          );
                        })}
                      </select>

                      {matchedFile && (
                        <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                          <FileText className="w-3 h-3 text-accent shrink-0" />
                          <span className="font-medium text-text-primary truncate max-w-[200px]">
                            {matchedFile.name}
                          </span>
                          <span>• {matchedFile.pageCount} pages</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Expiry Date Input */}
                  <td className="p-3">
                    {req.has_expiry ? (
                      <div>
                        <label htmlFor={`expiry-${req.id}`} className="sr-only">
                          Expiry date for {title}
                        </label>
                        <input
                          id={`expiry-${req.id}`}
                          type="date"
                          value={currentExpiry}
                          disabled={!currentFileId}
                          onChange={e => onExpiryChange(req.id, e.target.value)}
                          className={`w-full text-xs rounded-lg border bg-surface px-2.5 py-1.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-40 disabled:cursor-not-allowed ${
                            !currentExpiry && currentFileId
                              ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/20'
                              : currentExpiry && currentExpiry < submissionDeadline
                              ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20'
                              : 'border-border'
                          }`}
                        />
                        {!currentExpiry && currentFileId && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                            * Expiry required
                          </span>
                        )}
                        {currentExpiry && currentExpiry < submissionDeadline && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                            * Expired prior to deadline
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-text-secondary text-[11px] italic">
                        N/A (No expiry required)
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="p-3">
                    <StatusBadge status={status} lang={lang} />
                  </td>

                  {/* Actions (Unmatch) */}
                  <td className="p-3 text-center">
                    {currentFileId ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onMatchChange(req.id, undefined);
                          onShowToast({
                            type: 'info',
                            message: `${title} unmatched.`,
                          });
                        }}
                        className="p-1 text-text-secondary hover:text-error hover:bg-error-subtle"
                        title={t.unmatchAction}
                        aria-label={`Unmatch ${title}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    ) : (
                      <span className="text-text-secondary text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
