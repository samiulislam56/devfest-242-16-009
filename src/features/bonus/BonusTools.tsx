import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Save,
  FolderOpen,
  Stamp,
  Upload,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import {
  Tender,
  RequirementValidationResult,
  Language,
} from '../../types';
import { Button } from '../../components/ui/Button';
import { getTranslation } from '../i18n/translations';

interface BonusToolsProps {
  tender: Tender;
  validationResults: RequirementValidationResult[];
  lang: Language;
  onSaveSession: () => void;
  onLoadSession: () => void;
  onShowToast: (msg: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
  sealPreviewUrl?: string;
  sealApplyTo: 'all' | 'last' | 'cover';
  onSealUpload: (bytes: Uint8Array, previewUrl: string) => void;
  onSealRemove: () => void;
  onSealApplyToChange: (applyTo: 'all' | 'last' | 'cover') => void;
}

export const BonusTools: React.FC<BonusToolsProps> = ({
  tender,
  validationResults,
  lang,
  onSaveSession,
  onLoadSession,
  onShowToast,
  sealPreviewUrl,
  sealApplyTo,
  onSealUpload,
  onSealRemove,
  onSealApplyToChange,
}) => {
  const t = getTranslation(lang);
  const sealInputRef = useRef<HTMLInputElement>(null);

  // FR-18: Export checklist data to Excel (.xlsx) and CSV
  const exportChecklist = (format: 'xlsx' | 'csv') => {
    try {
      const data = validationResults.map(r => ({
        Order: r.requirement.order,
        'Requirement ID': r.requirement.id,
        'Requirement Name (EN)': r.requirement.title_en,
        'Requirement Name (BN)': r.requirement.title_bn,
        Mandatory: r.requirement.mandatory ? 'YES' : 'NO',
        'Has Expiry': r.requirement.has_expiry ? 'YES' : 'NO',
        'Matched File': r.matchedFile ? r.matchedFile.name : 'NONE',
        'Page Count': r.matchedFile ? r.matchedFile.pageCount : 0,
        'Expiry Date': r.expiryDate || 'N/A',
        Status: r.status,
        Blocking: r.isBlocking ? 'YES' : 'NO',
        'Duplicate Conflict': r.duplicateWarning || 'None',
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tender Checklist');

      const fileName = `${tender.tender_id}_Checklist.${format}`;
      if (format === 'csv') {
        XLSX.writeFile(workbook, fileName, { bookType: 'csv' });
      } else {
        XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
      }

      onShowToast({
        type: 'success',
        message: `Exported checklist to ${fileName} successfully!`,
      });
    } catch (e) {
      onShowToast({
        type: 'error',
        message: 'Checklist export failed: ' + String(e),
      });
    }
  };

  const handleSealFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast({
        type: 'error',
        message: 'Please upload a PNG or image file for seal / signature.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = evt => {
      const arrayBuffer = evt.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      const preview = URL.createObjectURL(file);
      onSealUpload(bytes, preview);
      onShowToast({
        type: 'success',
        message: 'Seal / signature uploaded and ready to apply to package!',
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      {/* Session Management (FR-19) */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Save className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Session Persistence (FR-19 Bonus)
            </h3>
            <p className="text-xs text-text-secondary">
              Save your matched documents, expiry dates and requirements into local browser storage.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSaveSession}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t.saveProjectButton}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onLoadSession}
            leftIcon={<FolderOpen className="w-4 h-4" />}
          >
            {t.loadProjectButton}
          </Button>
        </div>
      </div>

      {/* Checklist Export (FR-18) */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              Export Checklist as Excel / CSV (FR-18 Bonus)
            </h3>
            <p className="text-xs text-text-secondary">
              Generate structured spreadsheet audit logs with requirement names, file mappings, expiry dates and statuses.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => exportChecklist('xlsx')}
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
          >
            {t.exportExcelButton}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => exportChecklist('csv')}
            leftIcon={<FileCheck2 className="w-4 h-4" />}
          >
            {t.exportCsvButton}
          </Button>
        </div>
      </div>

      {/* Digital Seal / Signature (FR-17) */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Stamp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-primary">
              {t.sealUploadTitle}
            </h3>
            <p className="text-xs text-text-secondary">
              {t.sealUploadDesc}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            ref={sealInputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleSealFileSelect}
            className="hidden"
            id="seal-image-input"
          />

          {!sealPreviewUrl ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => sealInputRef.current?.click()}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload Seal / Signature Image
            </Button>
          ) : (
            <div className="flex items-center gap-4 p-3 bg-surface-raised rounded-lg border border-border">
              <img
                src={sealPreviewUrl}
                alt="Digital Seal Preview"
                className="w-16 h-16 object-contain bg-white rounded border border-border p-1"
              />
              <div className="space-y-1 flex-1">
                <span className="text-xs font-bold text-text-primary">
                  Seal Loaded & Ready
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sealApply"
                      checked={sealApplyTo === 'all'}
                      onChange={() => onSealApplyToChange('all')}
                      className="text-accent"
                    />
                    <span>{t.sealApplyToAll}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sealApply"
                      checked={sealApplyTo === 'cover'}
                      onChange={() => onSealApplyToChange('cover')}
                      className="text-accent"
                    />
                    <span>{t.sealApplyToCover}</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="sealApply"
                      checked={sealApplyTo === 'last'}
                      onChange={() => onSealApplyToChange('last')}
                      className="text-accent"
                    />
                    <span>{t.sealApplyToLast}</span>
                  </label>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSealRemove}
                className="text-error hover:bg-error-subtle"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                {t.removeSeal}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
