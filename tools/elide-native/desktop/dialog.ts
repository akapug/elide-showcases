/**
 * Elide Desktop Framework - Native Dialogs
 *
 * Cross-platform native dialog boxes (open, save, message, etc.)
 */

import { NativeBridge } from '../runtime/bridge';
import { Window } from './window';

export interface OpenDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  properties?: Array<
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'promptToCreate'
    | 'noResolveAliases'
    | 'treatPackageAsDirectory'
    | 'dontAddToRecent'
  >;
  message?: string;
}

export interface SaveDialogOptions {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: FileFilter[];
  message?: string;
  nameFieldLabel?: string;
  showsTagField?: boolean;
  properties?: Array<
    | 'showHiddenFiles'
    | 'createDirectory'
    | 'treatPackageAsDirectory'
    | 'showOverwriteConfirmation'
    | 'dontAddToRecent'
  >;
}

export interface MessageBoxOptions {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning';
  buttons?: string[];
  defaultId?: number;
  title?: string;
  message: string;
  detail?: string;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  icon?: string;
  cancelId?: number;
  noLink?: boolean;
  normalizeAccessKeys?: boolean;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export interface OpenDialogReturnValue {
  canceled: boolean;
  filePaths: string[];
}

export interface SaveDialogReturnValue {
  canceled: boolean;
  filePath?: string;
}

export interface MessageBoxReturnValue {
  response: number;
  checkboxChecked: boolean;
}

export interface CertificateTrustDialogOptions {
  certificate: {
    data: Uint8Array;
    issuerName: string;
  };
  message: string;
}

export class Dialog {
  static async showOpenDialog(
    window: Window | undefined,
    options: OpenDialogOptions
  ): Promise<OpenDialogReturnValue> {
    return NativeBridge.showOpenDialog(window?.['handle'], options);
  }

  static showOpenDialogSync(
    window: Window | undefined,
    options: OpenDialogOptions
  ): string[] {
    return NativeBridge.showOpenDialogSync(window?.['handle'], options);
  }

  static async showSaveDialog(
    window: Window | undefined,
    options: SaveDialogOptions
  ): Promise<SaveDialogReturnValue> {
    return NativeBridge.showSaveDialog(window?.['handle'], options);
  }

  static showSaveDialogSync(
    window: Window | undefined,
    options: SaveDialogOptions
  ): string | undefined {
    return NativeBridge.showSaveDialogSync(window?.['handle'], options);
  }

  static async showMessageBox(
    window: Window | undefined,
    options: MessageBoxOptions
  ): Promise<MessageBoxReturnValue> {
    return NativeBridge.showMessageBox(window?.['handle'], options);
  }

  static showMessageBoxSync(
    window: Window | undefined,
    options: MessageBoxOptions
  ): number {
    return NativeBridge.showMessageBoxSync(window?.['handle'], options);
  }

  static async showErrorBox(title: string, content: string): Promise<void> {
    return NativeBridge.showErrorBox(title, content);
  }

  static async showCertificateTrustDialog(
    window: Window | undefined,
    options: CertificateTrustDialogOptions
  ): Promise<void> {
    return NativeBridge.showCertificateTrustDialog(window?.['handle'], options);
  }
}

// Convenience methods for common dialog patterns

export class DialogHelpers {
  static async showInfo(
    title: string,
    message: string,
    detail?: string,
    window?: Window
  ): Promise<void> {
    await Dialog.showMessageBox(window, {
      type: 'info',
      title,
      message,
      detail,
      buttons: ['OK'],
    });
  }

  static async showWarning(
    title: string,
    message: string,
    detail?: string,
    window?: Window
  ): Promise<void> {
    await Dialog.showMessageBox(window, {
      type: 'warning',
      title,
      message,
      detail,
      buttons: ['OK'],
    });
  }

  static async showError(
    title: string,
    message: string,
    detail?: string,
    window?: Window
  ): Promise<void> {
    await Dialog.showMessageBox(window, {
      type: 'error',
      title,
      message,
      detail,
      buttons: ['OK'],
    });
  }

  static async confirm(
    title: string,
    message: string,
    detail?: string,
    window?: Window
  ): Promise<boolean> {
    const result = await Dialog.showMessageBox(window, {
      type: 'question',
      title,
      message,
      detail,
      buttons: ['Yes', 'No'],
      defaultId: 0,
      cancelId: 1,
    });

    return result.response === 0;
  }

  static async choose(
    title: string,
    message: string,
    choices: string[],
    detail?: string,
    window?: Window
  ): Promise<number> {
    const result = await Dialog.showMessageBox(window, {
      type: 'question',
      title,
      message,
      detail,
      buttons: choices,
    });

    return result.response;
  }

  static async selectFile(
    title?: string,
    defaultPath?: string,
    filters?: FileFilter[],
    window?: Window
  ): Promise<string | undefined> {
    const result = await Dialog.showOpenDialog(window, {
      title,
      defaultPath,
      filters,
      properties: ['openFile'],
    });

    return result.canceled ? undefined : result.filePaths[0];
  }

  static async selectFiles(
    title?: string,
    defaultPath?: string,
    filters?: FileFilter[],
    window?: Window
  ): Promise<string[]> {
    const result = await Dialog.showOpenDialog(window, {
      title,
      defaultPath,
      filters,
      properties: ['openFile', 'multiSelections'],
    });

    return result.canceled ? [] : result.filePaths;
  }

  static async selectDirectory(
    title?: string,
    defaultPath?: string,
    window?: Window
  ): Promise<string | undefined> {
    const result = await Dialog.showOpenDialog(window, {
      title,
      defaultPath,
      properties: ['openDirectory'],
    });

    return result.canceled ? undefined : result.filePaths[0];
  }

  static async saveFile(
    title?: string,
    defaultPath?: string,
    filters?: FileFilter[],
    window?: Window
  ): Promise<string | undefined> {
    const result = await Dialog.showSaveDialog(window, {
      title,
      defaultPath,
      filters,
    });

    return result.canceled ? undefined : result.filePath;
  }
}
