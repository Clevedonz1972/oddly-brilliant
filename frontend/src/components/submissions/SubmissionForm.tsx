import { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { submissionsService } from '../../services/submissions.service';
import { formatFileSize } from '../../utils/format';
import type { SubmissionFile } from '../../types/submissions';
import type { ApiError } from '../../types';

interface SubmissionFormProps {
  challengeId: string;
  proposalId?: string;
  onSuccess?: () => void;
}

// Allowed file types (MIME types)
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/javascript',
  'application/javascript',
  'application/typescript',
  'text/typescript',
  'application/x-typescript',
  'text/x-typescript',
  'text/jsx',
  'text/tsx',
  'text/x-python',
  'text/x-java-source',
  'text/x-c++src',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
];

// File extensions mapping
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx',
  '.txt', '.md', '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.mp4', '.mov', '.avi'
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB in bytes

/**
 * Form for contributors to submit work for a challenge
 * Features drag-and-drop file upload, validation, and progress tracking
 */
export const SubmissionForm = ({ challengeId, proposalId, onSuccess }: SubmissionFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<SubmissionFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file before upload
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" exceeds 25MB limit`;
    }

    // Check file type by extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);
    const isValidMimeType = ALLOWED_FILE_TYPES.includes(file.type);

    if (!isValidExtension && !isValidMimeType) {
      return `File type "${extension}" is not allowed`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    // First create draft submission if not exists
    let currentSubmissionId = submissionId;
    if (!currentSubmissionId) {
      if (!title.trim() || !description.trim()) {
        setError('Please enter title and description before uploading files');
        return;
      }

      try {
        setLoading(true);
        const newSubmission = await submissionsService.create({
          challengeId,
          proposalId,
          title: title.trim(),
          description: description.trim(),
        });
        currentSubmissionId = newSubmission.id;
        setSubmissionId(currentSubmissionId);
        setFiles(newSubmission.files);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to create submission');
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    // Validate and upload each file
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }

      // Upload file
      try {
        setUploadingFileId(file.name);
        const updatedSubmission = await submissionsService.uploadFile(currentSubmissionId!, file);
        setFiles(updatedSubmission.files);
        setError(null);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadingFileId(null);
      }
    }
  };

  // Handle file removal
  const handleRemoveFile = async (fileId: string) => {
    if (!submissionId) return;

    try {
      const updatedSubmission = await submissionsService.removeFile(submissionId, fileId);
      setFiles(updatedSubmission.files);
      setError(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to remove file');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (title.trim().length < 3 || title.trim().length > 200) {
      setError('Title must be between 3 and 200 characters');
      return;
    }

    if (description.trim().length < 10 || description.trim().length > 5000) {
      setError('Description must be between 10 and 5000 characters');
      return;
    }

    setLoading(true);

    try {
      let currentSubmissionId = submissionId;

      // Create draft if not exists
      if (!currentSubmissionId) {
        const newSubmission = await submissionsService.create({
          challengeId,
          proposalId,
          title: title.trim(),
          description: description.trim(),
        });
        currentSubmissionId = newSubmission.id;
        setSubmissionId(currentSubmissionId);
      }

      // Submit for review
      await submissionsService.submit(currentSubmissionId);

      setSuccess(true);
      setTitle('');
      setDescription('');
      setFiles([]);
      setSubmissionId(null);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to submit work. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimetype.startsWith('video/')) {
      return (
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (mimetype === 'application/pdf') {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-6 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
        <h3
          className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Submit Your Work
        </h3>

        {/* Title Input */}
        <Input
          label="Title"
          type="text"
          id="submission-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief title for your submission"
          required
          disabled={loading}
          aria-required="true"
          minLength={3}
          maxLength={200}
        />

        {/* Description Textarea */}
        <div className="mb-4">
          <label
            htmlFor="submission-description"
            className="block text-sm font-medium mb-2 text-[var(--text-secondary)] uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Description *
          </label>
          <textarea
            id="submission-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your submission and what you've accomplished..."
            rows={6}
            disabled={loading}
            required
            minLength={10}
            maxLength={5000}
            className="input input-focus-glow w-full resize-none"
            aria-required="true"
            aria-label="Submission description"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {description.length}/5000 characters (minimum 10)
          </p>
        </div>

        {/* File Upload Zone */}
        <div className="mb-4">
          <label
            className="block text-sm font-medium mb-2 text-[var(--text-secondary)] uppercase tracking-wide"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Attachments
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                : 'border-[var(--border)] hover:border-[var(--primary)]'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              multiple
              accept={ALLOWED_EXTENSIONS.join(',')}
              aria-label="File upload input"
            />
            <svg
              className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-[var(--text-primary)] mb-1">
              Drag files here or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[var(--primary)] hover:text-[var(--primary)]/80 font-semibold underline"
                aria-label="Click to browse files"
              >
                click to browse
              </button>
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Max 25MB per file • Images, docs, code, video
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
              Uploaded Files ({files.length})
            </p>
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border)]"
              >
                {getFileIcon(file.mimetype)}
                <div className="flex-1 min-w-0">
                  <p className="text-[var(--text-primary)] truncate">{file.originalName}</p>
                  <p className="text-sm text-[var(--text-muted)]">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(file.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  aria-label={`Remove ${file.originalName}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Uploading Indicator */}
        {uploadingFileId && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500 rounded-lg text-blue-400 flex items-center gap-2">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Uploading {uploadingFileId}...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-start gap-2"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="mb-4 p-3 bg-green-900/20 border border-green-500 rounded-lg text-green-400 flex items-start gap-2"
            role="alert"
            aria-live="polite"
          >
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Work submitted successfully!</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          loading={loading}
          disabled={loading || !title.trim() || !description.trim()}
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold"
          aria-label="Submit work for review"
        >
          {loading ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </div>
    </form>
  );
};
