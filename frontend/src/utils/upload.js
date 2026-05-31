import { formatBytes } from "./format";

// Accepted MIME types for project floor plans / images.
export const PROJECT_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_PROJECT_FILES = 6;

export const isPdf = (value = "") =>
  /pdf/i.test(value) || /\.pdf($|\?)/i.test(value) || value.startsWith("data:application/pdf");

// Chat attachments — documents, spreadsheets, and images.
export const CHAT_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png"
];

export const MAX_CHAT_FILE_BYTES = 15 * 1024 * 1024; // 15 MB

// Classify a file by mime type / name so the UI can pick an icon + label.
export const fileKind = (mimeType = "", name = "") => {
  const value = `${mimeType} ${name}`.toLowerCase();
  if (mimeType.startsWith("image/")) return "image";
  if (isPdf(value)) return "pdf";
  if (/sheet|excel|\.xlsx?$/.test(value)) return "sheet";
  if (/word|document|\.docx?$/.test(value)) return "doc";
  return "file";
};

/**
 * Validate a freshly-selected FileList against type/size/count rules.
 * Returns the accepted files plus a list of human-readable rejection reasons.
 */
export const validateFiles = (
  fileList,
  { allowed = PROJECT_FILE_TYPES, maxBytes = MAX_FILE_BYTES, maxCount = MAX_PROJECT_FILES, existingCount = 0 } = {}
) => {
  const files = Array.from(fileList || []);
  const valid = [];
  const errors = [];

  for (const file of files) {
    if (existingCount + valid.length >= maxCount) {
      errors.push(`You can attach up to ${maxCount} files.`);
      break;
    }
    const typeOk = allowed.includes(file.type) || (isPdf(file.name) && allowed.includes("application/pdf"));
    if (!typeOk) {
      errors.push(`"${file.name}" is not a supported type (PDF, JPG, JPEG, PNG only).`);
      continue;
    }
    if (file.size > maxBytes) {
      errors.push(`"${file.name}" is ${formatBytes(file.size)} — exceeds the ${formatBytes(maxBytes)} limit.`);
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
};
