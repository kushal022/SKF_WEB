import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { useUploadMediaMutation } from '../../app/store/api';
import { useToast } from './useToast';

export interface ImageUploadProps {
  label?: string;
  value?: string | null;
  publicId?: string | null;
  onChange: (url: string, publicId?: string) => void;
  onRemove?: () => void;
  folder?: string;
  helperText?: string;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
  required?: boolean;
  error?: string;
  aspectRatio?: 'square' | 'video' | 'wide' | 'auto';
  className?: string;
  allowManualUrl?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/x-icon',
];

export function ImageUpload({
  label,
  value,
  publicId,
  onChange,
  onRemove,
  folder = 'skf_furniture',
  helperText = 'Supported formats: PNG, JPG, WEBP, SVG (up to 10MB)',
  maxSizeMB = 10,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
  required = false,
  error,
  aspectRatio = 'auto',
  className = '',
  allowManualUrl = true,
}: ImageUploadProps) {
  const { showToast } = useToast();
  const [uploadMedia, { isLoading: isUploading }] = useUploadMediaMutation();

  const [dragActive, setDragActive] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualUrl, setManualUrl] = useState(value || '');
  const [prevValue, setPrevValue] = useState(value);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (value !== prevValue) {
    setPrevValue(value);
    setManualUrl(value || '');
  }

  const validateFile = (file: File): string | null => {
    // Validate MIME type or extension
    const mimeMatch = acceptedTypes.includes(file.type);
    const extMatch = /\.(jpe?g|png|webp|svg|gif|ico)$/i.test(file.name);

    if (!mimeMatch && !extMatch) {
      return `Invalid format: "${file.name}". Please upload a JPG, PNG, WEBP, SVG, or GIF image.`;
    }

    // Validate size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${maxSizeMB}MB limit.`;
    }

    return null;
  };

  const handleFileSelect = async (file: File) => {
    setInternalError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setInternalError(validationError);
      showToast('error', validationError, 'Invalid Image File');
      return;
    }

    try {
      const response = await uploadMedia({ file, folder }).unwrap();

      if (response.success && response.data) {
        const uploadedUrl = response.data.secure_url || response.data.url;
        const uploadedPublicId = response.data.public_id || undefined;

        onChange(uploadedUrl, uploadedPublicId);
        showToast(
          'success',
          response.data.storage === 'cloudinary'
            ? 'Image successfully uploaded to Cloudinary.'
            : 'Image successfully uploaded and processed.',
          'Upload Complete'
        );
      } else {
        throw new Error(response.message || 'Upload returned unsuccessful response.');
      }
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.message || 'Failed to upload image. Please try again.';
      setInternalError(msg);
      showToast('error', msg, 'Upload Failed');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || isUploading) return;

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
    if (disabled || isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setInternalError(null);
    onChange('', '');
    if (onRemove) {
      onRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualApply = () => {
    if (!manualUrl.trim()) {
      handleRemove();
      return;
    }
    onChange(manualUrl.trim(), undefined);
    setInternalError(null);
  };

  const displayError = error || internalError;
  const hasValue = Boolean(value && value.trim());

  // Aspect ratio helper classes
  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square max-w-[140px]'
      : aspectRatio === 'video'
      ? 'aspect-video max-w-[240px]'
      : aspectRatio === 'wide'
      ? 'aspect-2/1 max-w-[280px]'
      : 'max-h-36 max-w-full';

  return (
    <div className={`w-full flex flex-col gap-1.5 text-left ${className}`}>
      {/* Label and Manual URL toggle */}
      <div className="flex items-center justify-between">
        {label && (
          <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] select-none flex items-center gap-1">
            {label}
            {required && <span className="text-[var(--status-error)]">*</span>}
          </label>
        )}

        {allowManualUrl && !isUploading && (
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] text-[var(--brand-accent)] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <LinkIcon className="w-3 h-3" />
            {showManualInput ? 'Hide URL field' : 'Enter URL manually'}
          </button>
        )}
      </div>

      {/* Manual URL Input drawer */}
      {showManualInput && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-[var(--border-border)] bg-[var(--surface-muted)] mb-1">
          <Input
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://res.cloudinary.com/... or image link"
            disabled={disabled || isUploading}
            className="flex-1 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleManualApply}
            disabled={disabled || isUploading}
          >
            Apply
          </Button>
        </div>
      )}

      {/* Case 1: Image exists -> Show Preview Card */}
      {hasValue ? (
        <div className="relative rounded-xl border border-[var(--border-border)] bg-[var(--surface-surface)] p-3.5 flex flex-col sm:flex-row items-center sm:items-start gap-4 transition-all hover:border-[var(--brand-accent)]/50">
          {/* Image Thumbnail Container */}
          <div
            className={`relative rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-[var(--border-border)] shrink-0 flex items-center justify-center ${aspectClass}`}
          >
            <img
              src={value || ''}
              alt={label || 'Uploaded preview'}
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                setImageLoaded(false);
                (e.target as HTMLElement).style.display = 'none';
              }}
              className="w-full h-full object-contain max-h-32"
            />
            {!imageLoaded && (
              <div className="p-4 text-center text-xs text-[var(--text-muted)] flex flex-col items-center gap-1">
                <ImageIcon className="w-6 h-6 text-[var(--text-muted)]" />
                <span>Loading preview...</span>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-accent)]" />
                <span className="text-[11px] font-medium">Uploading...</span>
              </div>
            )}
          </div>

          {/* Details & Actions */}
          <div className="flex-1 min-w-0 w-full sm:w-auto text-left">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--status-success)] bg-[var(--status-success)]/10 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                {publicId ? 'Cloudinary Asset' : 'Active Image'}
              </span>

              {publicId && (
                <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">
                  ID: {publicId}
                </span>
              )}
            </div>

            <p className="text-xs text-[var(--text-secondary)] mt-1.5 truncate max-w-full font-mono bg-[var(--surface-muted)] px-2 py-1 rounded border border-[var(--border-border)]">
              {value}
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Replace Image
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs text-[var(--status-error)] hover:bg-[var(--status-error)]/10"
                disabled={disabled || isUploading}
                onClick={handleRemove}
                leftIcon={<X className="w-3.5 h-3.5" />}
              >
                Remove
              </Button>

              <a
                href={value || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors ml-auto p-1.5"
                title="View full image in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: No Image -> Modern Dropzone */
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200
            ${
              dragActive
                ? 'border-[var(--brand-accent)] bg-[var(--brand-accent)]/5 scale-[0.99]'
                : 'border-[var(--border-border)] hover:border-[var(--brand-accent)] hover:bg-[var(--surface-muted)]/50 bg-[var(--surface-surface)]'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2.5 py-2">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--brand-accent)]" />
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Uploading image to Cloudinary...
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                Optimizing & generating secure CDN URL
              </p>
            </div>
          ) : (
            <>
              <div className="w-11 h-11 rounded-full bg-[var(--surface-muted)] flex items-center justify-center text-[var(--brand-accent)] mb-2.5 shadow-xs border border-[var(--border-border)]">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">
                Choose Image <span className="font-normal text-[var(--text-secondary)]">or drag and drop</span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{helperText}</p>
            </>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* Error message */}
      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-[var(--status-error)] font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
