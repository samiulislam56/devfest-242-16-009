import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  FileX,
  X,
} from 'lucide-react';
import { UploadedFile, Language } from '../../types';
import { Button } from '../../components/ui/Button';
import { getTranslation } from '../i18n/translations';
import { computeFileHash } from '../../lib/hashing/hashFile';
import { inspectPDFFile } from '../../lib/pdf/pdfParser';
import { createSamplePdfFile, createDuplicateSamplePair } from '../../lib/pdf/sampleGenerator';

interface FileUploaderProps {
  files: UploadedFile[];
  onFilesChanged: (files: UploadedFile[]) => void;
  lang: Language;
  onShowToast: (msg: { type: 'success' | 'error' | 'warning' | 'info'; message: string }) => void;
  onAutoMatch?: () => void;
}

const MAX_FILES = 30;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

export const FileUploader: React.FC<FileUploaderProps> = ({
  files,
  onFilesChanged,
  lang,
  onShowToast,
  onAutoMatch,
}) => {
  const t = getTranslation(lang);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewingFile, setPreviewingFile] = useState<UploadedFile | null>(null);

  const totalSize = files.reduce((acc, f) => acc + f.size, 0);
  const totalMb = (totalSize / (1024 * 1024)).toFixed(2);

  const processFileList = async (incomingFiles: FileList | File[]) => {
    setIsProcessing(true);
    const newFiles: UploadedFile[] = [...files];
    let currentTotalSize = totalSize;

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];

      // 1. Check max 30 files limit (FR-03, Section 13)
      if (newFiles.length >= MAX_FILES) {
        onShowToast({
          type: 'error',
          message: `${t.errorMaxFiles} Current count: ${newFiles.length}/${MAX_FILES}.`,
        });
        break;
      }

      // 2. Reject non-PDF files (FR-03)
      const isPdf =
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        onShowToast({
          type: 'error',
          message: `${t.errorNonPdf} "${file.name}" (${file.type || 'unknown type'}).`,
        });
        continue;
      }

      // 3. Check total size <= 50 MB (Section 13)
      if (currentTotalSize + file.size > MAX_TOTAL_BYTES) {
        onShowToast({
          type: 'error',
          message: `${t.errorMaxSize} "${file.name}" would exceed 50 MB limit.`,
        });
        continue;
      }

      try {
        // Inspect PDF (page count, encryption, corruption)
        const inspection = await inspectPDFFile(file);

        if (inspection.isEncrypted) {
          onShowToast({
            type: 'warning',
            message: `${t.errorEncryptedPdf} "${file.name}". Password protected files are not supported.`,
          });
        }

        if (inspection.isCorrupted) {
          onShowToast({
            type: 'error',
            message: `${t.errorDamagedPdf} "${file.name}". ${inspection.errorMessage || ''}`,
          });
        }

        // Compute content hash for exact duplicate detection (FR-09)
        const hash = await computeFileHash(file);
        const objectUrl = URL.createObjectURL(file);

        newFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'application/pdf',
          pageCount: inspection.pageCount,
          hash,
          objectUrl,
          isEncrypted: inspection.isEncrypted,
          isCorrupted: inspection.isCorrupted,
          errorMessage: inspection.errorMessage,
        });

        currentTotalSize += file.size;
      } catch (e) {
        onShowToast({
          type: 'error',
          message: `Failed to process ${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`,
        });
      }
    }

    // Re-evaluate duplicates across all files
    const updatedWithDuplicates = detectDuplicateFiles(newFiles);
    onFilesChanged(updatedWithDuplicates);
    setIsProcessing(false);
  };

  const detectDuplicateFiles = (list: UploadedFile[]): UploadedFile[] => {
    // Group files by SHA-256 hash
    const hashMap = new Map<string, string[]>();
    list.forEach(f => {
      const existing = hashMap.get(f.hash) || [];
      existing.push(f.id);
      hashMap.set(f.hash, existing);
    });

    return list.map(f => {
      const matchIds = hashMap.get(f.hash) || [];
      const isDuplicate = matchIds.length > 1;
      return {
        ...f,
        isDuplicate,
        duplicateGroupId: isDuplicate ? `dup-${f.hash.substring(0, 8)}` : undefined,
      };
    });
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.objectUrl);
    }
    const filtered = files.filter(f => f.id !== id);
    onFilesChanged(detectDuplicateFiles(filtered));
  };

  const handleClearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.objectUrl));
    onFilesChanged([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  // Generate instant realistic sample test pack
  const handleGenerateSampleFiles = async () => {
    setIsProcessing(true);
    try {
      const f1 = await createSamplePdfFile('Trade_License_2026.pdf', 'Trade License Certificate', 2);
      const f2 = await createSamplePdfFile('Tax_Clearance_FY2025.pdf', 'Tax Clearance Certificate', 1);
      const f3 = await createSamplePdfFile('VAT_Registration_Bin.pdf', 'VAT Registration Document', 1);
      const f4 = await createSamplePdfFile('Bank_Solvency_Letter.pdf', 'Bank Solvency Assurance', 2);
      const f5 = await createSamplePdfFile('Manufacturer_Authorization_MAF.pdf', 'Manufacturer Authorization Form', 3);
      const f6 = await createSamplePdfFile('Audit_Financial_Report.pdf', 'Audited Financial Statement', 4);
      const f7 = await createSamplePdfFile('ISO_9001_Quality_Cert.pdf', 'ISO 9001:2015 Certificate', 1);

      await processFileList([f1, f2, f3, f4, f5, f6, f7]);
      onShowToast({
        type: 'success',
        message: t.samplePdfsGeneratedMsg,
      });
    } catch (e) {
      onShowToast({
        type: 'error',
        message: 'Could not generate sample files: ' + String(e),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate duplicate pair to demonstrate duplicate detection test
  const handleGenerateDuplicatePair = async () => {
    setIsProcessing(true);
    try {
      const { original, duplicate } = await createDuplicateSamplePair();
      await processFileList([original, duplicate]);
      onShowToast({
        type: 'warning',
        message: 'Loaded duplicate content pair with different filenames to test duplicate detection (FR-09 & FR-10).',
      });
    } catch (e) {
      onShowToast({
        type: 'error',
        message: 'Failed to generate duplicate pair: ' + String(e),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-text-primary">
              {t.uploadSectionTitle}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              {t.uploadDescription}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSampleFiles}
              isLoading={isProcessing}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
              title="Generate sample PDFs to immediately test the builder"
            >
              {t.generateSamplePdfs}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateDuplicatePair}
              isLoading={isProcessing}
              leftIcon={<Copy className="w-3.5 h-3.5 text-amber-500" />}
              title="Add 2 identical PDFs with different filenames to test duplicate blocking"
            >
              + Duplicate Test Pair
            </Button>
          </div>
        </div>

        {/* Drag and drop area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 select-none ${
            isDragging
              ? 'border-accent bg-accent-subtle/50 scale-[0.99]'
              : 'border-border hover:border-accent hover:bg-surface-raised/40'
          }`}
          aria-label="Upload PDF documents"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                processFileList(e.target.files);
              }
              if (e.target) e.target.value = '';
            }}
            className="hidden"
            id="pdf-multi-file-input"
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-text-primary">
              {t.dragDropText}{' '}
              <span className="text-accent underline font-bold">
                {t.browseFiles}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{t.filesLimitHint}</p>
          </div>
        </div>

        {/* Upload Limits KPI Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-surface-raised border border-border text-xs">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-text-secondary">{t.uploadedFilesCount}: </span>
              <strong className={files.length >= MAX_FILES ? 'text-error' : 'text-text-primary'}>
                {files.length} / {MAX_FILES}
              </strong>
            </div>
            <div>
              <span className="text-text-secondary">{t.totalSize}: </span>
              <strong className={totalSize >= MAX_TOTAL_BYTES ? 'text-error' : 'text-text-primary'}>
                {totalMb} MB / 50 MB
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAutoMatch && files.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={onAutoMatch}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                title={t.autoMatchTooltip}
              >
                {t.autoMatchFiles}
              </Button>
            )}
            {files.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-error hover:bg-error-subtle hover:text-red-700"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                {t.removeAllFiles}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Files List */}
      <div className="p-5 rounded-xl bg-surface border border-border shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-text-primary">
            {t.fileListTitle} ({files.length})
          </h3>
          {files.some(f => f.isDuplicate) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Duplicate content detected across {files.filter(f => f.isDuplicate).length} files
            </span>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl bg-surface-raised/20">
            <FileX className="w-10 h-10 text-text-secondary mx-auto mb-2 opacity-50" />
            <p className="text-xs text-text-secondary">{t.noFilesUploaded}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs" aria-label="Uploaded PDF Files">
              <thead className="bg-surface-raised text-text-secondary font-semibold uppercase tracking-wider border-b border-border">
                <tr>
                  <th scope="col" className="p-3">
                    {t.fileName}
                  </th>
                  <th scope="col" className="p-3">
                    {t.pageCount}
                  </th>
                  <th scope="col" className="p-3">
                    {t.fileSize}
                  </th>
                  <th scope="col" className="p-3">
                    {t.duplicateStatus}
                  </th>
                  <th scope="col" className="p-3 text-right">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {files.map(file => (
                  <tr
                    key={file.id}
                    className={`hover:bg-surface-raised/40 transition-colors ${
                      file.isDuplicate ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-accent shrink-0" />
                        <span className="font-medium text-text-primary max-w-xs sm:max-w-md truncate" title={file.name}>
                          {file.name}
                        </span>
                        {file.isCorrupted && (
                          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                            Damaged
                          </span>
                        )}
                        {file.isEncrypted && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">
                            Encrypted
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-secondary font-mono mt-0.5">
                        Hash: {file.hash.substring(0, 14)}...
                      </div>
                    </td>

                    <td className="p-3 font-semibold text-text-primary">
                      {file.pageCount > 0 ? `${file.pageCount} pages` : '—'}
                    </td>

                    <td className="p-3 text-text-secondary">
                      {(file.size / 1024).toFixed(1)} KB
                    </td>

                    <td className="p-3">
                      {file.isDuplicate ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{t.duplicateDetectedBadge}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3 shrink-0" />
                          <span>{t.uniqueFileBadge}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewingFile(file)}
                          className="p-1.5 text-text-secondary hover:text-accent"
                          title="Preview PDF"
                          aria-label={`Preview ${file.name}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 text-text-secondary hover:text-error hover:bg-error-subtle"
                          title="Remove file"
                          aria-label={`Remove ${file.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF Quick Preview Modal */}
      {previewingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" />
                <div>
                  <h4 className="text-sm font-bold text-text-primary truncate max-w-lg">
                    {previewingFile.name}
                  </h4>
                  <div className="text-[11px] text-text-secondary">
                    {previewingFile.pageCount} pages • {(previewingFile.size / 1024).toFixed(1)} KB • SHA-256: {previewingFile.hash.substring(0, 16)}...
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingFile(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-border"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-2 bg-slate-900/10 dark:bg-black/50 min-h-[500px]">
              <iframe
                src={previewingFile.objectUrl}
                title={`Preview of ${previewingFile.name}`}
                className="w-full h-full min-h-[500px] rounded border border-border bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
