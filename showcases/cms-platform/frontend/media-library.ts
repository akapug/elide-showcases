/**
 * CMS Platform - Media Library Component
 *
 * Media management interface for uploading, organizing, and selecting media files.
 * Supports folders, search, and multiple file uploads.
 */

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  alt?: string;
  caption?: string;
  uploadedBy: {
    id: string;
    username: string;
  };
  uploadedAt: Date;
  folder?: string;
  width?: number;
  height?: number;
}

interface MediaFolder {
  name: string;
  path: string;
  itemCount: number;
  subfolders: string[];
}

interface MediaLibraryConfig {
  allowedTypes: string[];
  maxFileSize: number;
  uploadEndpoint: string;
  selectionMode: 'single' | 'multiple';
}

/**
 * Media Library Component
 */
export class MediaLibrary {
  private config: MediaLibraryConfig;
  private items: MediaItem[] = [];
  private folders: Map<string, MediaFolder> = new Map();
  private currentFolder: string = '';
  private selectedItems: Set<string> = new Set();
  private searchQuery: string = '';
  private viewMode: 'grid' | 'list' = 'grid';
  private onSelectCallback?: (items: MediaItem[]) => void;

  constructor(config: Partial<MediaLibraryConfig> = {}) {
    this.config = {
      allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
      maxFileSize: 10 * 1024 * 1024, // 10MB
      uploadEndpoint: '/api/media/upload',
      selectionMode: 'single',
      ...config
    };
  }

  /**
   * Initialize media library
   */
  async initialize(container: HTMLElement): Promise<void> {
    this.renderLibrary(container);
    this.setupEventHandlers();
    await this.loadMedia();
    await this.loadFolders();
  }

  /**
   * Load media items
   */
  async loadMedia(folder: string = ''): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (folder) {
        params.set('folder', folder);
      }

      const response = await fetch(`/api/media?${params}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load media');
      }

      this.items = await response.json();
      this.currentFolder = folder;
      this.updateMediaGrid();
    } catch (error) {
      console.error('Failed to load media:', error);
      this.showError('Failed to load media items');
    }
  }

  /**
   * Load folder structure
   */
  async loadFolders(): Promise<void> {
    try {
      const response = await fetch('/api/media/folders', {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to load folders');
      }

      const folders = await response.json();
      this.folders.clear();

      folders.forEach((folder: MediaFolder) => {
        this.folders.set(folder.path, folder);
      });

      this.updateFolderTree();
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  }

  /**
   * Upload files
   */
  async uploadFiles(files: FileList): Promise<MediaItem[]> {
    const uploaded: MediaItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const item = await this.uploadFile(file);
        uploaded.push(item);
      } catch (error) {
        errors.push(`${file.name}: Upload failed`);
      }
    }

    if (errors.length > 0) {
      this.showError(`Some files failed to upload:\n${errors.join('\n')}`);
    }

    if (uploaded.length > 0) {
      await this.loadMedia(this.currentFolder);
    }

    return uploaded;
  }

  /**
   * Upload single file
   */
  private async uploadFile(file: File): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);

    if (this.currentFolder) {
      formData.append('folder', this.currentFolder);
    }

    const response = await fetch(this.config.uploadEndpoint, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return response.json();
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${this.formatFileSize(this.config.maxFileSize)}`
      };
    }

    // Check file type
    const isAllowed = this.config.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: 'File type not allowed'
      };
    }

    return { valid: true };
  }

  /**
   * Delete media item
   */
  async deleteItem(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      await this.loadMedia(this.currentFolder);
      this.selectedItems.delete(id);
    } catch (error) {
      console.error('Failed to delete item:', error);
      this.showError('Failed to delete item');
    }
  }

  /**
   * Update item metadata
   */
  async updateItemMetadata(id: string, metadata: {
    alt?: string;
    caption?: string;
    folder?: string;
  }): Promise<void> {
    try {
      const response = await fetch(`/api/media/${id}`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metadata)
      });

      if (!response.ok) {
        throw new Error('Update failed');
      }

      await this.loadMedia(this.currentFolder);
    } catch (error) {
      console.error('Failed to update item:', error);
      this.showError('Failed to update item');
    }
  }

  /**
   * Create folder
   */
  async createFolder(name: string, parent?: string): Promise<void> {
    try {
      const response = await fetch('/api/media/folders', {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, parent })
      });

      if (!response.ok) {
        throw new Error('Failed to create folder');
      }

      await this.loadFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      this.showError('Failed to create folder');
    }
  }

  /**
   * Search media
   */
  search(query: string): void {
    this.searchQuery = query.toLowerCase();
    this.updateMediaGrid();
  }

  /**
   * Clear search
   */
  clearSearch(): void {
    this.searchQuery = '';
    const searchInput = document.querySelector('.media-search input') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }
    this.updateMediaGrid();
  }

  /**
   * Toggle item selection
   */
  toggleSelection(id: string): void {
    if (this.config.selectionMode === 'single') {
      this.selectedItems.clear();
      this.selectedItems.add(id);
    } else {
      if (this.selectedItems.has(id)) {
        this.selectedItems.delete(id);
      } else {
        this.selectedItems.add(id);
      }
    }

    this.updateMediaGrid();
    this.updateSelectionUI();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedItems.clear();
    this.updateMediaGrid();
    this.updateSelectionUI();
  }

  /**
   * Get selected items
   */
  getSelectedItems(): MediaItem[] {
    return this.items.filter(item => this.selectedItems.has(item.id));
  }

  /**
   * Confirm selection
   */
  confirmSelection(): void {
    const selected = this.getSelectedItems();

    if (selected.length === 0) {
      this.showError('Please select at least one item');
      return;
    }

    if (this.onSelectCallback) {
      this.onSelectCallback(selected);
    }

    this.clearSelection();
  }

  /**
   * Register selection callback
   */
  onSelect(callback: (items: MediaItem[]) => void): void {
    this.onSelectCallback = callback;
  }

  /**
   * Set view mode
   */
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    this.updateMediaGrid();
  }

  /**
   * Render library UI
   */
  private renderLibrary(container: HTMLElement): void {
    container.innerHTML = `
      <div class="media-library">
        <div class="media-header">
          <div class="media-toolbar">
            <button class="btn-upload" title="Upload Files">
              <span>📤 Upload</span>
            </button>
            <button class="btn-new-folder" title="New Folder">
              <span>📁 New Folder</span>
            </button>
            <div class="media-search">
              <input type="text" placeholder="Search media..." />
              <button class="btn-search-clear">✕</button>
            </div>
            <div class="view-mode-toggle">
              <button class="btn-view-grid active" data-mode="grid" title="Grid View">⊞</button>
              <button class="btn-view-list" data-mode="list" title="List View">☰</button>
            </div>
          </div>
          <div class="media-breadcrumb">
            <span class="breadcrumb-item" data-folder="">Home</span>
          </div>
        </div>

        <div class="media-content">
          <div class="media-sidebar">
            <div class="folder-tree">
              <div class="folder-item" data-folder="">
                <span class="folder-icon">📁</span>
                <span class="folder-name">All Files</span>
              </div>
            </div>
          </div>

          <div class="media-main">
            <div class="media-grid"></div>
          </div>
        </div>

        <div class="media-footer">
          <div class="media-selection">
            <span class="selection-count">0 items selected</span>
            <button class="btn-clear-selection">Clear</button>
          </div>
          <div class="media-actions">
            <button class="btn-cancel">Cancel</button>
            <button class="btn-select-confirm">Select</button>
          </div>
        </div>

        <input type="file" class="file-input" multiple hidden />
      </div>
    `;
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    const container = this.getContainer();
    if (!container) return;

    // Upload button
    const btnUpload = container.querySelector('.btn-upload');
    const fileInput = container.querySelector('.file-input') as HTMLInputElement;

    btnUpload?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        this.uploadFiles(target.files);
        target.value = '';
      }
    });

    // Drag and drop
    const mediaMain = container.querySelector('.media-main');
    mediaMain?.addEventListener('dragover', (e) => {
      e.preventDefault();
      mediaMain.classList.add('drag-over');
    });

    mediaMain?.addEventListener('dragleave', () => {
      mediaMain.classList.remove('drag-over');
    });

    mediaMain?.addEventListener('drop', (e) => {
      e.preventDefault();
      mediaMain.classList.remove('drag-over');

      const files = (e as DragEvent).dataTransfer?.files;
      if (files) {
        this.uploadFiles(files);
      }
    });

    // New folder button
    container.querySelector('.btn-new-folder')?.addEventListener('click', () => {
      this.showNewFolderDialog();
    });

    // Search
    const searchInput = container.querySelector('.media-search input') as HTMLInputElement;
    searchInput?.addEventListener('input', (e) => {
      this.search((e.target as HTMLInputElement).value);
    });

    container.querySelector('.btn-search-clear')?.addEventListener('click', () => {
      this.clearSearch();
    });

    // View mode toggle
    container.querySelectorAll('.view-mode-toggle button').forEach(button => {
      button.addEventListener('click', () => {
        const mode = (button as HTMLElement).dataset.mode as 'grid' | 'list';
        this.setViewMode(mode);

        container.querySelectorAll('.view-mode-toggle button').forEach(b => {
          b.classList.remove('active');
        });
        button.classList.add('active');
      });
    });

    // Selection actions
    container.querySelector('.btn-clear-selection')?.addEventListener('click', () => {
      this.clearSelection();
    });

    container.querySelector('.btn-select-confirm')?.addEventListener('click', () => {
      this.confirmSelection();
    });

    container.querySelector('.btn-cancel')?.addEventListener('click', () => {
      this.clearSelection();
      window.dispatchEvent(new CustomEvent('close-media-library'));
    });
  }

  /**
   * Update media grid
   */
  private updateMediaGrid(): void {
    const grid = this.getContainer()?.querySelector('.media-grid');
    if (!grid) return;

    // Filter items
    let filteredItems = this.items;

    if (this.searchQuery) {
      filteredItems = filteredItems.filter(item =>
        item.originalName.toLowerCase().includes(this.searchQuery) ||
        item.alt?.toLowerCase().includes(this.searchQuery) ||
        item.caption?.toLowerCase().includes(this.searchQuery)
      );
    }

    // Render items
    if (filteredItems.length === 0) {
      grid.innerHTML = '<div class="media-empty">No media items found</div>';
      return;
    }

    grid.className = `media-grid view-${this.viewMode}`;
    grid.innerHTML = filteredItems.map(item => this.renderMediaItem(item)).join('');

    // Setup item event handlers
    grid.querySelectorAll('.media-item').forEach(element => {
      const itemId = (element as HTMLElement).dataset.id;
      if (!itemId) return;

      element.addEventListener('click', () => {
        this.toggleSelection(itemId);
      });

      const btnDelete = element.querySelector('.btn-delete-item');
      btnDelete?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteItem(itemId);
      });

      const btnEdit = element.querySelector('.btn-edit-item');
      btnEdit?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showEditDialog(itemId);
      });
    });
  }

  /**
   * Render single media item
   */
  private renderMediaItem(item: MediaItem): string {
    const isSelected = this.selectedItems.has(item.id);
    const isImage = item.mimeType.startsWith('image/');

    return `
      <div class="media-item ${isSelected ? 'selected' : ''}" data-id="${item.id}">
        <div class="media-preview">
          ${isImage
            ? `<img src="${item.url}" alt="${item.alt || item.originalName}" />`
            : `<div class="media-icon">${this.getFileIcon(item.mimeType)}</div>`
          }
          ${isSelected ? '<div class="selection-overlay">✓</div>' : ''}
        </div>
        <div class="media-info">
          <div class="media-name" title="${item.originalName}">${item.originalName}</div>
          <div class="media-meta">
            <span>${this.formatFileSize(item.size)}</span>
            <span>${new Date(item.uploadedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="media-actions">
          <button class="btn-edit-item" title="Edit">✏️</button>
          <button class="btn-delete-item" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  /**
   * Update folder tree
   */
  private updateFolderTree(): void {
    const tree = this.getContainer()?.querySelector('.folder-tree');
    if (!tree) return;

    const html = ['<div class="folder-item active" data-folder=""><span class="folder-icon">📁</span><span class="folder-name">All Files</span></div>'];

    this.folders.forEach((folder, path) => {
      html.push(`
        <div class="folder-item" data-folder="${path}">
          <span class="folder-icon">📁</span>
          <span class="folder-name">${folder.name}</span>
          <span class="folder-count">(${folder.itemCount})</span>
        </div>
      `);
    });

    tree.innerHTML = html.join('');

    // Setup folder click handlers
    tree.querySelectorAll('.folder-item').forEach(element => {
      element.addEventListener('click', () => {
        const folder = (element as HTMLElement).dataset.folder || '';
        this.loadMedia(folder);

        tree.querySelectorAll('.folder-item').forEach(item => {
          item.classList.remove('active');
        });
        element.classList.add('active');
      });
    });
  }

  /**
   * Update selection UI
   */
  private updateSelectionUI(): void {
    const container = this.getContainer();
    if (!container) return;

    const count = container.querySelector('.selection-count');
    if (count) {
      const selected = this.selectedItems.size;
      count.textContent = `${selected} item${selected !== 1 ? 's' : ''} selected`;
    }
  }

  /**
   * Show new folder dialog
   */
  private showNewFolderDialog(): void {
    const name = prompt('Enter folder name:');
    if (name) {
      this.createFolder(name, this.currentFolder);
    }
  }

  /**
   * Show edit dialog
   */
  private showEditDialog(id: string): void {
    const item = this.items.find(i => i.id === id);
    if (!item) return;

    const alt = prompt('Alt text:', item.alt || '');
    const caption = prompt('Caption:', item.caption || '');

    if (alt !== null || caption !== null) {
      this.updateItemMetadata(id, {
        alt: alt || undefined,
        caption: caption || undefined
      });
    }
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    alert(message);
  }

  /**
   * Get file icon for mime type
   */
  private getFileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType === 'application/pdf') return '📄';
    return '📎';
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get auth headers
   */
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('cms_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Get container element
   */
  private getContainer(): HTMLElement | null {
    return document.querySelector('.media-library');
  }
}
