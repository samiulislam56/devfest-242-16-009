export interface Tender {
  tender_id: string;
  title: string;
  procuring_entity: string;
  bidder: string;
  submission_deadline: string; // YYYY-MM-DD
}

export interface Requirement {
  id: string;
  order: number;
  title_en: string;
  title_bn: string;
  mandatory: boolean;
  has_expiry: boolean;
}

export interface RequirementsData {
  tender: Tender;
  requirements: Requirement[];
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  pageCount: number;
  hash: string;
  duplicateGroupId?: string;
  isDuplicate?: boolean;
  objectUrl: string;
  isEncrypted?: boolean;
  isCorrupted?: boolean;
  errorMessage?: string;
}

export type DocumentStatusType =
  | 'MISSING'
  | 'EXPIRY_NEEDED'
  | 'EXPIRED'
  | 'NOT_PROVIDED'
  | 'OK';

export interface DocumentStatusInfo {
  status: DocumentStatusType;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
  descriptionBn: string;
  isBlocking: boolean;
}

export interface RequirementMatchState {
  requirementId: string;
  fileId?: string;
  expiryDate?: string; // YYYY-MM-DD
}

export interface RequirementValidationResult {
  requirement: Requirement;
  status: DocumentStatusType;
  isBlocking: boolean;
  matchedFile?: UploadedFile;
  expiryDate?: string;
  duplicateWarning?: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'en' | 'bn';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}
