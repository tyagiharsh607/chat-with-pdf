import { useState } from "react";

const FileHeader = ({ chat }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!chat?.file_url) return null;

  // Get file icon based on file type
  const getFileIcon = (fileName) => {
    if (!fileName) return "📄";
    const extension = fileName.toLowerCase().split(".").pop();

    switch (extension) {
      case "pdf":
        return "📄";
      case "txt":
        return "📝";
      case "csv":
        return "📊";
      default:
        return "📄";
    }
  };

  // Format file size if available
  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  const handleFileAccess = (e) => {
    e.stopPropagation(); // Prevent expand/collapse

    if (chat?.file_url) {
      window.open(chat.file_url, "_blank");
    }
  };

  // Format upload date
  const formatUploadDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mb-4 border-b border-border-primary bg-surface-hover/50 backdrop-blur-sm ">
      <div className="px-6 py-3">
        <div
          className="flex items-center space-x-3 cursor-pointer hover:bg-surface-hover/50 rounded-lg p-2 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* File Icon */}
          <div
            className="text-2xl cursor-pointer hover:scale-110 transition-transform p-1 rounded-lg hover:bg-brand-primary/10"
            onClick={handleFileAccess}
            title="Click to open file"
          >
            {getFileIcon(chat.file_name)}
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-text-primary truncate">
                {chat.file_name || chat.title || "Uploaded Document"}
              </h3>
              {chat.file_size && (
                <span className="text-xs text-text-muted bg-surface-badge px-2 py-1 rounded-full">
                  {formatFileSize(chat.file_size)}
                </span>
              )}
            </div>

            {chat.created_at && (
              <p className="text-sm text-text-muted">
                Uploaded {formatUploadDate(chat.created_at)}
              </p>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <div
            className={`text-text-muted transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ⌄
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 p-3 bg-surface rounded-lg border border-border-primary">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-text-muted">File Type:</span>
                <span className="ml-2 text-text-primary font-medium">
                  {chat.file_name?.split(".").pop()?.toUpperCase() || "Unknown"}
                </span>
              </div>
              {chat.file_size && (
                <div>
                  <span className="text-text-muted">Size:</span>
                  <span className="ml-2 text-text-primary font-medium">
                    {formatFileSize(chat.file_size)}
                  </span>
                </div>
              )}
              {chat.created_at && (
                <div className="col-span-2">
                  <span className="text-text-muted">Uploaded:</span>
                  <span className="ml-2 text-text-primary font-medium">
                    {new Date(chat.created_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileHeader;
