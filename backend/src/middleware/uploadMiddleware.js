import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only images and PDF files are allowed"));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB — matches frontend validation
});

const audioFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error("Only audio files are allowed"));
  }
};

// Voice messages: capped at 10 MB (~10 min of opus) on top of duration limits.
export const audioUpload = multer({
  storage,
  fileFilter: audioFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Chat attachments: documents, spreadsheets, and images.
export const CHAT_FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel", // .xls
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "image/jpeg",
  "image/jpg",
  "image/png"
];

const chatFileFilter = (req, file, cb) => {
  if (CHAT_FILE_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Allowed: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG"));
  }
};

export const fileUpload = multer({
  storage,
  fileFilter: chatFileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB
});
