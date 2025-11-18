import React, { forwardRef } from 'react';
import { BaseProps, ChildrenProps } from '../../types';
import { Modal } from './Modal';

export interface DialogProps extends BaseProps, ChildrenProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  (
    {
      isOpen,
      onClose,
      onConfirm,
      title = 'Confirm Action',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDangerous = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Modal ref={ref} isOpen={isOpen} onClose={onClose} size="sm" {...props}>
        <div className="text-lg font-semibold mb-4">{title}</div>
        <div className="mb-6">{children}</div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={`px-4 py-2 rounded-md text-white transition-colors ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </Modal>
    );
  }
);

Dialog.displayName = 'Dialog';

export const AlertDialog = Dialog;
