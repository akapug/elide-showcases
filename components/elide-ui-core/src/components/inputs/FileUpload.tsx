import React, { forwardRef, useRef } from 'react';
import { BaseProps } from '../../types';
import { clsx } from 'clsx';

export interface FileUploadProps extends BaseProps {
  accept?: string;
  multiple?: boolean;
  onChange?: (files: FileList | null) => void;
  disabled?: boolean;
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ accept, multiple, onChange, disabled, className }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
      <div className={clsx('relative', className)}>
        <input
          ref={ref || inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => onChange?.(e.target.files)}
          disabled={disabled}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => (ref as any)?.current?.click() || inputRef.current?.click()}
          disabled={disabled}
          className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 transition-colors disabled:opacity-50"
        >
          Choose file(s)
        </button>
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
