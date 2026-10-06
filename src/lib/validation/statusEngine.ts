import { Requirement, DocumentStatusType, UploadedFile, RequirementValidationResult } from '../../types';

export function calculateRequirementStatus(
  requirement: Requirement,
  matchedFile: UploadedFile | undefined,
  expiryDate: string | undefined,
  submissionDeadline: string
): { status: DocumentStatusType; isBlocking: boolean } {
  // If no file is matched
  if (!matchedFile) {
    if (requirement.mandatory) {
      return { status: 'MISSING', isBlocking: true };
    } else {
      return { status: 'NOT_PROVIDED', isBlocking: false };
    }
  }

  // File is matched, check if expiry applies
  if (requirement.has_expiry) {
    if (!expiryDate || expiryDate.trim() === '') {
      return { status: 'EXPIRY_NEEDED', isBlocking: true };
    }

    // Compare date strings (YYYY-MM-DD format works with lexicographical comparison)
    // Same day is valid and OK
    if (expiryDate < submissionDeadline) {
      return { status: 'EXPIRED', isBlocking: true };
    }

    return { status: 'OK', isBlocking: false };
  }

  // File is matched and no expiry required
  return { status: 'OK', isBlocking: false };
}

export function validateAllRequirements(
  requirements: Requirement[],
  matchedFilesMap: Record<string, UploadedFile | undefined>,
  expiryDatesMap: Record<string, string | undefined>,
  submissionDeadline: string
): {
  results: RequirementValidationResult[];
  hasBlockingIssues: boolean;
  duplicateGroupConflicts: Record<string, string>; // requirementId -> message
} {
  // Check for duplicate content matched to multiple requirements
  // FR-10: "Prevent duplicate files from being matched to different documents."
  const duplicateGroupConflicts: Record<string, string> = {};
  
  // Group matched files by hash
  const hashToMatchedReqIds: Record<string, string[]> = {};
  for (const req of requirements) {
    const file = matchedFilesMap[req.id];
    if (file && file.hash) {
      if (!hashToMatchedReqIds[file.hash]) {
        hashToMatchedReqIds[file.hash] = [];
      }
      hashToMatchedReqIds[file.hash].push(req.id);
    }
  }

  // If identical content hash is matched to more than 1 requirement, mark conflict
  for (const reqIds of Object.values(hashToMatchedReqIds)) {
    if (reqIds.length > 1) {
      for (const reqId of reqIds) {
        duplicateGroupConflicts[reqId] = `Duplicate content: This identical document is also matched to requirement(s) ${reqIds.filter(id => id !== reqId).join(', ')}.`;
      }
    }
  }

  const results: RequirementValidationResult[] = [];
  let hasBlocking = false;

  // Sort requirements by order
  const sortedRequirements = [...requirements].sort((a, b) => a.order - b.order);

  for (const req of sortedRequirements) {
    const matchedFile = matchedFilesMap[req.id];
    const expiry = expiryDatesMap[req.id];
    const { status, isBlocking } = calculateRequirementStatus(
      req,
      matchedFile,
      expiry,
      submissionDeadline
    );

    const dupWarning = duplicateGroupConflicts[req.id];
    const effectiveBlocking = isBlocking || Boolean(dupWarning);

    if (effectiveBlocking) {
      hasBlocking = true;
    }

    results.push({
      requirement: req,
      status,
      isBlocking: effectiveBlocking,
      matchedFile,
      expiryDate: expiry,
      duplicateWarning: dupWarning,
    });
  }

  return {
    results,
    hasBlockingIssues: hasBlocking,
    duplicateGroupConflicts,
  };
}
