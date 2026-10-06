import React, { useState, useMemo } from 'react';
import {
  Tender,
  Requirement,
  UploadedFile,
  Language,
  ToastMessage,
} from '../types';
import { defaultTenderData } from '../features/tender/defaultData';
import { validateAllRequirements } from '../lib/validation/statusEngine';
import { Header } from '../components/navigation/Header';
import { Sidebar, NavSection } from '../components/navigation/Sidebar';
import { TenderOverview } from '../features/tender/TenderOverview';
import { RequirementsTable } from '../features/matching/RequirementsTable';
import { FileUploader } from '../features/upload/FileUploader';
import { ValidationPanel } from '../features/validation/ValidationPanel';
import { PackageGenerator } from '../features/package/PackageGenerator';
import { BonusTools } from '../features/bonus/BonusTools';
import { ToastSystem } from '../components/ui/ToastSystem';
import { getTranslation } from '../features/i18n/translations';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Core Data Model
  const [tender, setTender] = useState<Tender>(defaultTenderData.tender);
  const [requirements, setRequirements] = useState<Requirement[]>(defaultTenderData.requirements);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [matchedFileIds, setMatchedFileIds] = useState<Record<string, string | undefined>>({});
  const [expiryDates, setExpiryDates] = useState<Record<string, string | undefined>>({
    R01: '2026-12-31', // starter valid expiry date for demo
    R02: '2026-11-15',
    R05: '2027-06-30',
    R07: '2027-12-31',
  });

  // Digital Seal / Signature
  const [sealImageBytes, setSealImageBytes] = useState<Uint8Array | undefined>();
  const [sealPreviewUrl, setSealPreviewUrl] = useState<string | undefined>();
  const [sealApplyTo, setSealApplyTo] = useState<'all' | 'last' | 'cover'>('cover');

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toast: { type: 'success' | 'error' | 'warning' | 'info'; message: string; title?: string }) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newToast: ToastMessage = {
      id,
      type: toast.type,
      message: toast.message,
      title: toast.title,
    };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Convert matched file IDs to map of UploadedFiles
  const matchedFilesMap = useMemo(() => {
    const map: Record<string, UploadedFile | undefined> = {};
    const fileLookup = new Map(uploadedFiles.map(f => [f.id, f]));
    for (const [rId, fId] of Object.entries(matchedFileIds)) {
      if (fId) {
        map[rId] = fileLookup.get(fId);
      }
    }
    return map;
  }, [matchedFileIds, uploadedFiles]);

  // Recalculate status engine immediately after every relevant change (FR-08)
  const { results: validationResults, hasBlockingIssues, duplicateGroupConflicts } = useMemo(() => {
    return validateAllRequirements(
      requirements,
      matchedFilesMap,
      expiryDates,
      tender.submission_deadline
    );
  }, [requirements, matchedFilesMap, expiryDates, tender.submission_deadline]);

  const matchedCount = useMemo(() => {
    return Object.values(matchedFileIds).filter(Boolean).length;
  }, [matchedFileIds]);

  const blockingCount = useMemo(() => {
    return validationResults.filter(r => r.isBlocking).length;
  }, [validationResults]);

  // Handle Match change
  const handleMatchChange = (requirementId: string, fileId: string | undefined) => {
    setMatchedFileIds(prev => {
      const updated = { ...prev };
      if (!fileId) {
        delete updated[requirementId];
      } else {
        // Enforce one-to-one matching (FR-05)
        for (const [rId, fId] of Object.entries(updated)) {
          if (fId === fileId) {
            delete updated[rId];
          }
        }
        updated[requirementId] = fileId;
      }
      return updated;
    });
  };

  // Handle Expiry date change
  const handleExpiryChange = (requirementId: string, expiryDate: string) => {
    setExpiryDates(prev => ({
      ...prev,
      [requirementId]: expiryDate,
    }));
  };

  // Auto-Match Files to Requirements based on filenames (FR-20 Bonus)
  const handleAutoMatch = () => {
    if (uploadedFiles.length === 0) {
      showToast({
        type: 'warning',
        message: 'No uploaded files available to match.',
      });
      return;
    }

    const newMatches: Record<string, string | undefined> = { ...matchedFileIds };
    const usedFileIds = new Set(Object.values(newMatches).filter(Boolean) as string[]);
    let matchCount = 0;

    for (const req of requirements) {
      if (newMatches[req.id]) continue; // already matched

      const reqTokens = (req.title_en + ' ' + req.id)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);

      // Find best file match
      let bestFile: UploadedFile | null = null;
      let highestScore = 0;

      for (const file of uploadedFiles) {
        if (usedFileIds.has(file.id)) continue;
        const fname = file.name.toLowerCase();

        let score = 0;
        for (const token of reqTokens) {
          if (fname.includes(token)) score += 2;
        }

        if (score > highestScore && score >= 2) {
          highestScore = score;
          bestFile = file;
        }
      }

      if (bestFile) {
        newMatches[req.id] = bestFile.id;
        usedFileIds.add(bestFile.id);
        matchCount++;
      }
    }

    setMatchedFileIds(newMatches);
    showToast({
      type: 'success',
      message: `Auto-matched ${matchCount} document${matchCount === 1 ? '' : 's'} based on filename patterns!`,
    });
  };

  // Load custom requirements
  const handleLoadRequirements = (newTender: Tender, newReqs: Requirement[]) => {
    setTender(newTender);
    setRequirements(newReqs);
    setMatchedFileIds({});
  };

  // Session persistence (FR-19 Bonus)
  const handleSaveSession = () => {
    try {
      const session = {
        tender,
        requirements,
        matchedFileIds,
        expiryDates,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('tender_builder_session', JSON.stringify(session));
      showToast({
        type: 'success',
        message: getTranslation(lang).sessionSavedMsg,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Could not save session to local storage.',
      });
    }
  };

  const handleLoadSession = () => {
    try {
      const raw = localStorage.getItem('tender_builder_session');
      if (!raw) {
        showToast({
          type: 'warning',
          message: 'No saved session found in this browser.',
        });
        return;
      }
      const data = JSON.parse(raw);
      if (data.tender) setTender(data.tender);
      if (data.requirements) setRequirements(data.requirements);
      if (data.matchedFileIds) setMatchedFileIds(data.matchedFileIds);
      if (data.expiryDates) setExpiryDates(data.expiryDates);

      showToast({
        type: 'success',
        message: getTranslation(lang).sessionLoadedMsg,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Failed to restore session.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans">
      {/* Sticky Header */}
      <Header
        currentLang={lang}
        onLanguageChange={setLang}
        onToggleSidebar={() => setIsDrawerOpen(prev => !prev)}
        tenderId={tender.tender_id}
        matchedCount={matchedCount}
        totalRequirements={requirements.length}
      />

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          lang={lang}
          isOpenMobile={isDrawerOpen}
          onCloseMobile={() => setIsDrawerOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          blockingCount={blockingCount}
          filesCount={uploadedFiles.length}
        />

        {/* Section Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {activeSection === 'overview' && (
            <TenderOverview
              tender={tender}
              requirements={requirements}
              lang={lang}
              onLoadRequirements={handleLoadRequirements}
              matchedCount={matchedCount}
              blockingCount={blockingCount}
              onShowToast={showToast}
            />
          )}

          {activeSection === 'requirements' && (
            <RequirementsTable
              requirements={requirements}
              uploadedFiles={uploadedFiles}
              validationResults={validationResults}
              matchedFileIds={matchedFileIds}
              expiryDates={expiryDates}
              submissionDeadline={tender.submission_deadline}
              lang={lang}
              onMatchChange={handleMatchChange}
              onExpiryChange={handleExpiryChange}
              onShowToast={showToast}
            />
          )}

          {activeSection === 'files' && (
            <FileUploader
              files={uploadedFiles}
              onFilesChanged={setUploadedFiles}
              lang={lang}
              onShowToast={showToast}
              onAutoMatch={handleAutoMatch}
            />
          )}

          {activeSection === 'validation' && (
            <ValidationPanel
              validationResults={validationResults}
              hasBlockingIssues={hasBlockingIssues}
              duplicateGroupConflicts={duplicateGroupConflicts}
              submissionDeadline={tender.submission_deadline}
              lang={lang}
              onNavigateTo={sec => setActiveSection(sec)}
            />
          )}

          {activeSection === 'package' && (
            <PackageGenerator
              tender={tender}
              validationResults={validationResults}
              hasBlockingIssues={hasBlockingIssues}
              lang={lang}
              onShowToast={showToast}
              sealImageBytes={sealImageBytes}
              sealApplyTo={sealApplyTo}
            />
          )}

          {activeSection === 'bonus' && (
            <BonusTools
              tender={tender}
              validationResults={validationResults}
              lang={lang}
              onSaveSession={handleSaveSession}
              onLoadSession={handleLoadSession}
              onShowToast={showToast}
              sealPreviewUrl={sealPreviewUrl}
              sealApplyTo={sealApplyTo}
              onSealUpload={(bytes, preview) => {
                setSealImageBytes(bytes);
                setSealPreviewUrl(preview);
              }}
              onSealRemove={() => {
                setSealImageBytes(undefined);
                setSealPreviewUrl(undefined);
              }}
              onSealApplyToChange={setSealApplyTo}
            />
          )}
        </main>
      </div>

      {/* Global Toast System */}
      <ToastSystem toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
