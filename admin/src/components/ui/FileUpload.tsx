import React, { useState, useRef } from 'react';
import { UploadCloud, X, AlertCircle } from 'lucide-react';
import Button from './Button';

export interface FileUploadProps {
  label?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  onFileSelect?: (file: File | null) => void;
  previewUrl?: string;
  helperText?: string;
  error?: string;
}

export function FileUpload({
  label = 'Upload Media Asset',
  maxSizeMB = 5,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  onFileSelect,
  previewUrl,
  helperText = 'Supported formats: PNG, JPG, WEBP, SVG (up to 5MB)',
  error,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalPreview, setInternalPreview] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFile = (file: File) => {
    setInternalError(null);

    // Validate MIME type
    if (!acceptedTypes.includes(file.type)) {
      const err = `Invalid file type: ${file.type}. Allowed: ${acceptedTypes.join(', ')}`;
      setInternalError(err);
      return;
    }

    // Validate size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const err = `File exceeds max allowed size of ${maxSizeMB}MB`;
      setInternalError(err);
      return;
    }

    // Generate local preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setInternalPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndHandleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setInternalPreview(null);
    setInternalError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const displayError = error || internalError;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none">
          {label}
        </span>
      )}

      {internalPreview ? (
        <div className="relative rounded-lg border border-[var(--border-border)] bg-[var(--surface-muted)] p-3 flex items-center gap-4">
          <div className="w-20 h-20 rounded-md overflow-hidden bg-black/5 flex items-center justify-center border border-[var(--border-border)] shrink-0">
            <img src={internalPreview} alt="Upload preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-primary)] truncate">Asset Selected</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Ready for upload pipeline</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              Change File
            </Button>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-surface)]"
            aria-label="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-150
            ${
              dragActive
                ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/5'
                : 'border-[var(--border-border)] hover:border-[var(--brand-accent)] bg-[var(--surface-surface)]'
            }
          `}
        >
          <div className="w-10 h-10 rounded-full bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-accent)] mb-2">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-[var(--text-primary)]">
            Click to upload <span className="font-normal text-[var(--text-secondary)]">or drag and drop</span>
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">{helperText}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleChange}
        className="hidden"
      />

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--status-error)] font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
