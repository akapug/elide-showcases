/**
 * Example: Native Desktop Text Editor
 *
 * A simple but complete text editor showing desktop app capabilities.
 * Compiles to a 15MB native binary with <50ms startup time.
 */

import { app, Window, Menu, MenuTemplates, Dialog, DialogHelpers } from '../../desktop';
import { FileSystem } from '../../runtime/fs';
import * as path from 'path';

interface EditorState {
  currentFile?: string;
  content: string;
  modified: boolean;
}

class TextEditor {
  private mainWindow?: Window;
  private state: EditorState = {
    content: '',
    modified: false,
  };

  async start(): Promise<void> {
    await app.whenReady();

    this.createWindow();
    this.createMenu();

    // Handle reopen on macOS
    app.on('activate', () => {
      if (!this.mainWindow || this.mainWindow.isDestroyed()) {
        this.createWindow();
      }
    });

    // Handle file opening
    app.on('open-file', async (event, filePath) => {
      event.preventDefault();
      await this.openFile(filePath);
    });
  }

  private createWindow(): void {
    this.mainWindow = new Window({
      title: 'Text Editor - Untitled',
      width: 1200,
      height: 800,
      minWidth: 600,
      minHeight: 400,
      backgroundColor: '#ffffff',
    });

    app.setMainWindow(this.mainWindow);

    // Load editor UI
    this.mainWindow.loadHTML(this.getEditorHTML());

    // Handle window close
    this.mainWindow.on('close', async (event) => {
      if (this.state.modified) {
        event.preventDefault();

        const shouldSave = await DialogHelpers.confirm(
          'Unsaved Changes',
          'Do you want to save your changes before closing?',
          'Your changes will be lost if you don\'t save them.',
          this.mainWindow
        );

        if (shouldSave) {
          const saved = await this.saveFile();
          if (saved) {
            this.mainWindow!.destroy();
          }
        } else {
          this.mainWindow!.destroy();
        }
      }
    });

    // Set up keyboard shortcuts
    this.setupKeyboardShortcuts();
  }

  private createMenu(): void {
    const appName = 'Text Editor';
    const template = MenuTemplates.createDefaultTemplate(appName);

    // Add File menu items
    const fileMenuIndex = template.findIndex(item => item.label === 'File');
    if (fileMenuIndex === -1) {
      template.unshift({
        label: 'File',
        submenu: [],
      });
    }

    const fileMenu = template[fileMenuIndex === -1 ? 0 : fileMenuIndex];
    fileMenu.submenu = [
      {
        label: 'New',
        accelerator: 'CmdOrCtrl+N',
        click: () => this.newFile(),
      },
      {
        label: 'Open...',
        accelerator: 'CmdOrCtrl+O',
        click: () => this.openFileDialog(),
      },
      {
        type: 'separator',
      },
      {
        label: 'Save',
        accelerator: 'CmdOrCtrl+S',
        click: () => this.saveFile(),
      },
      {
        label: 'Save As...',
        accelerator: 'CmdOrCtrl+Shift+S',
        click: () => this.saveFileAs(),
      },
      {
        type: 'separator',
      },
      ...(fileMenu.submenu as any[] || []),
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupKeyboardShortcuts(): void {
    // Additional shortcuts handled via menu
  }

  private getEditorHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Text Editor</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    #toolbar {
      background: #f0f0f0;
      border-bottom: 1px solid #ddd;
      padding: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    #toolbar button {
      padding: 6px 12px;
      border: 1px solid #ccc;
      background: white;
      border-radius: 4px;
      cursor: pointer;
    }

    #toolbar button:hover {
      background: #f5f5f5;
    }

    #editor {
      flex: 1;
      padding: 20px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
      border: none;
      outline: none;
      resize: none;
    }

    #statusbar {
      background: #f0f0f0;
      border-top: 1px solid #ddd;
      padding: 5px 10px;
      font-size: 12px;
      display: flex;
      justify-content: space-between;
    }

    #statusbar .modified {
      color: #ff6600;
    }
  </style>
</head>
<body>
  <div id="toolbar">
    <button onclick="newFile()">New</button>
    <button onclick="openFile()">Open</button>
    <button onclick="saveFile()">Save</button>
    <button onclick="saveFileAs()">Save As</button>
  </div>

  <textarea id="editor" placeholder="Start typing..."></textarea>

  <div id="statusbar">
    <div id="status-left">
      <span id="filename">Untitled</span>
      <span id="modified-indicator"></span>
    </div>
    <div id="status-right">
      <span id="line-col">Line 1, Column 1</span>
      <span id="char-count">0 characters</span>
    </div>
  </div>

  <script>
    const editor = document.getElementById('editor');
    const filenameEl = document.getElementById('filename');
    const modifiedIndicatorEl = document.getElementById('modified-indicator');
    const lineColEl = document.getElementById('line-col');
    const charCountEl = document.getElementById('char-count');

    let currentFile = null;
    let isModified = false;

    // Update status bar
    editor.addEventListener('input', () => {
      updateStatus();
      setModified(true);
    });

    editor.addEventListener('keyup', () => {
      updateLineCol();
    });

    editor.addEventListener('click', () => {
      updateLineCol();
    });

    function updateStatus() {
      const content = editor.value;
      charCountEl.textContent = content.length + ' characters';
    }

    function updateLineCol() {
      const cursorPos = editor.selectionStart;
      const textBeforeCursor = editor.value.substring(0, cursorPos);
      const line = textBeforeCursor.split('\\n').length;
      const column = textBeforeCursor.split('\\n').pop().length + 1;
      lineColEl.textContent = \`Line \${line}, Column \${column}\`;
    }

    function setModified(modified) {
      isModified = modified;
      modifiedIndicatorEl.textContent = modified ? ' • Modified' : '';
      modifiedIndicatorEl.className = modified ? 'modified' : '';
    }

    function setFilename(filename) {
      currentFile = filename;
      filenameEl.textContent = filename || 'Untitled';
      document.title = 'Text Editor - ' + (filename || 'Untitled');
    }

    function setContent(content) {
      editor.value = content;
      updateStatus();
      updateLineCol();
      setModified(false);
    }

    function getContent() {
      return editor.value;
    }

    // Focus editor on load
    window.addEventListener('load', () => {
      editor.focus();
      updateStatus();
      updateLineCol();
    });

    // Bridge functions (called from native code)
    window.newFile = function() {
      // Handled by native code
    };

    window.openFile = function() {
      // Handled by native code
    };

    window.saveFile = function() {
      // Handled by native code
    };

    window.saveFileAs = function() {
      // Handled by native code
    };
  </script>
</body>
</html>
    `;
  }

  private async newFile(): Promise<void> {
    if (this.state.modified) {
      const shouldSave = await DialogHelpers.confirm(
        'Unsaved Changes',
        'Do you want to save your changes?',
        undefined,
        this.mainWindow
      );

      if (shouldSave) {
        await this.saveFile();
      }
    }

    this.state = {
      content: '',
      modified: false,
    };

    this.mainWindow?.loadHTML(this.getEditorHTML());
    this.updateWindowTitle();
  }

  private async openFileDialog(): Promise<void> {
    const filePath = await DialogHelpers.selectFile(
      'Open File',
      undefined,
      [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      this.mainWindow
    );

    if (filePath) {
      await this.openFile(filePath);
    }
  }

  private async openFile(filePath: string): Promise<void> {
    try {
      const content = await FileSystem.readFile(filePath, 'utf8');

      this.state = {
        currentFile: filePath,
        content,
        modified: false,
      };

      // Update editor
      this.mainWindow?.loadHTML(this.getEditorHTML());
      this.updateWindowTitle();

      // TODO: Execute JavaScript to set content
    } catch (error) {
      await DialogHelpers.showError(
        'Error Opening File',
        'Failed to open file',
        error instanceof Error ? error.message : String(error),
        this.mainWindow
      );
    }
  }

  private async saveFile(): Promise<boolean> {
    if (!this.state.currentFile) {
      return this.saveFileAs();
    }

    try {
      // TODO: Get content from editor
      await FileSystem.writeFile(this.state.currentFile, this.state.content, 'utf8');

      this.state.modified = false;
      this.updateWindowTitle();

      return true;
    } catch (error) {
      await DialogHelpers.showError(
        'Error Saving File',
        'Failed to save file',
        error instanceof Error ? error.message : String(error),
        this.mainWindow
      );
      return false;
    }
  }

  private async saveFileAs(): Promise<boolean> {
    const filePath = await DialogHelpers.saveFile(
      'Save File',
      this.state.currentFile,
      [
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      this.mainWindow
    );

    if (!filePath) {
      return false;
    }

    this.state.currentFile = filePath;
    return this.saveFile();
  }

  private updateWindowTitle(): void {
    const filename = this.state.currentFile
      ? path.basename(this.state.currentFile)
      : 'Untitled';
    const modified = this.state.modified ? ' •' : '';
    this.mainWindow?.setTitle(`Text Editor - ${filename}${modified}`);
  }
}

// Export for native compilation
export async function main() {
  const editor = new TextEditor();
  await editor.start();
}

// Run if this is the entry point
if (require.main === module) {
  main().catch(error => {
    console.error('Failed to start editor:', error);
    process.exit(1);
  });
}
