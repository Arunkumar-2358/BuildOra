import { Download, FileSpreadsheet, FileText, File as FileIcon } from "lucide-react";
import { formatBytes } from "../utils/format";
import { fileKind } from "../utils/upload";

const iconFor = {
  pdf: { Icon: FileText, className: "bg-red-500/15 text-red-400" },
  doc: { Icon: FileText, className: "bg-blue-500/15 text-blue-400" },
  sheet: { Icon: FileSpreadsheet, className: "bg-emerald-500/15 text-emerald-400" },
  file: { Icon: FileIcon, className: "bg-surface-2 text-muted" }
};

/**
 * Renders a chat file message: image attachments show a thumbnail, everything
 * else shows a typed icon, name, size, and a download button. `mine` flips the
 * text colors so it reads on the gradient ("mine") bubble.
 */
export const FileAttachment = ({ file, mine = false }) => {
  if (!file?.url) return null;
  const kind = fileKind(file.mimeType, file.name);

  if (kind === "image") {
    return (
      <a href={file.url} target="_blank" rel="noreferrer" download={file.name} className="block">
        <img src={file.url} alt={file.name} className="max-h-60 w-full max-w-[16rem] rounded-xl object-cover" />
        <span className={`mt-1 flex items-center justify-between gap-3 text-[11px] ${mine ? "text-white/80" : "text-muted"}`}>
          <span className="truncate">{file.name}</span>
          <span className="flex-shrink-0">{formatBytes(file.sizeBytes)}</span>
        </span>
      </a>
    );
  }

  const { Icon, className } = iconFor[kind] || iconFor.file;

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      download={file.name}
      className={`flex min-w-[14rem] items-center gap-3 rounded-xl p-2 transition ${
        mine ? "bg-white/15 hover:bg-white/25" : "bg-surface hover:bg-surface-2"
      }`}
    >
      <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg ${className}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-semibold ${mine ? "text-white" : "text-content"}`}>{file.name}</span>
        <span className={`block text-xs ${mine ? "text-white/70" : "text-muted"}`}>{formatBytes(file.sizeBytes)}</span>
      </span>
      <Download className={`h-4 w-4 flex-shrink-0 ${mine ? "text-white/80" : "text-muted"}`} />
    </a>
  );
};
