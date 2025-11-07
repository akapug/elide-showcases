/**
 * Offline Notes App Example
 * Demonstrates offline-first functionality with automatic sync
 */

import { ElideDB } from '../../client/client-api';
import { Document, TableSchema } from '../../types';

// Note document interface
interface NoteDocument extends Document {
  title: string;
  content: string;
  folder?: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  color?: string;
  lastModified: number;
}

// Folder document interface
interface FolderDocument extends Document {
  name: string;
  icon?: string;
  color?: string;
  parent?: string;
}

/**
 * Offline Notes Application
 */
class OfflineNotesApp {
  private db: ElideDB;
  private deviceId: string;

  constructor(syncUrl?: string) {
    this.deviceId = `device-${Math.random().toString(36).substr(2, 9)}`;

    this.db = new ElideDB({
      name: 'offline-notes',
      syncUrl,
      syncInterval: 5000, // Sync every 5 seconds when online
    });
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    const schemas: TableSchema[] = [
      {
        name: 'notes',
        fields: [
          { name: 'title', type: 'string', required: true },
          { name: 'content', type: 'string', required: true },
          { name: 'folder', type: 'string' },
          { name: 'tags', type: 'json', required: true },
          { name: 'pinned', type: 'boolean', required: true },
          { name: 'archived', type: 'boolean', required: true },
          { name: 'color', type: 'string' },
          { name: 'lastModified', type: 'number', required: true }
        ]
      },
      {
        name: 'folders',
        fields: [
          { name: 'name', type: 'string', required: true },
          { name: 'icon', type: 'string' },
          { name: 'color', type: 'string' },
          { name: 'parent', type: 'string' }
        ]
      }
    ];

    await this.db.init(schemas);

    console.log(`Offline Notes App initialized on device: ${this.deviceId}`);
    this.logOnlineStatus();
  }

  /**
   * Create a new note
   */
  async createNote(
    title: string,
    content: string,
    options: {
      folder?: string;
      tags?: string[];
      color?: string;
      pinned?: boolean;
    } = {}
  ): Promise<NoteDocument> {
    const note = await this.db.insert<NoteDocument>('notes', {
      title,
      content,
      folder: options.folder,
      tags: options.tags || [],
      color: options.color,
      pinned: options.pinned || false,
      archived: false,
      lastModified: Date.now()
    });

    console.log(`📝 Created note: "${title}" ${this.getOnlineIndicator()}`);
    return note;
  }

  /**
   * Update note content
   */
  async updateNote(
    noteId: string,
    updates: Partial<NoteDocument>
  ): Promise<NoteDocument> {
    const note = await this.db.update<NoteDocument>('notes', noteId, {
      ...updates,
      lastModified: Date.now()
    });

    console.log(`✏️  Updated note: "${note.title}" ${this.getOnlineIndicator()}`);
    return note;
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    const note = await this.db.get<NoteDocument>('notes', noteId);
    await this.db.delete('notes', noteId);
    console.log(`🗑️  Deleted note: "${note?.title}" ${this.getOnlineIndicator()}`);
  }

  /**
   * Pin/unpin a note
   */
  async togglePin(noteId: string): Promise<void> {
    const note = await this.db.get<NoteDocument>('notes', noteId);
    if (!note) throw new Error('Note not found');

    await this.updateNote(noteId, { pinned: !note.pinned });
    console.log(`📌 ${note.pinned ? 'Unpinned' : 'Pinned'} note: "${note.title}"`);
  }

  /**
   * Archive/unarchive a note
   */
  async toggleArchive(noteId: string): Promise<void> {
    const note = await this.db.get<NoteDocument>('notes', noteId);
    if (!note) throw new Error('Note not found');

    await this.updateNote(noteId, { archived: !note.archived });
    console.log(`📦 ${note.archived ? 'Unarchived' : 'Archived'} note: "${note.title}"`);
  }

  /**
   * Get all active notes (not archived)
   */
  async getAllNotes(): Promise<NoteDocument[]> {
    return this.db.table<NoteDocument>('notes')
      .where('archived', false)
      .orderByDesc('lastModified')
      .get();
  }

  /**
   * Get pinned notes
   */
  async getPinnedNotes(): Promise<NoteDocument[]> {
    return this.db.table<NoteDocument>('notes')
      .where('pinned', true)
      .where('archived', false)
      .orderByDesc('lastModified')
      .get();
  }

  /**
   * Get archived notes
   */
  async getArchivedNotes(): Promise<NoteDocument[]> {
    return this.db.table<NoteDocument>('notes')
      .where('archived', true)
      .orderByDesc('lastModified')
      .get();
  }

  /**
   * Get notes by folder
   */
  async getNotesByFolder(folderId: string): Promise<NoteDocument[]> {
    return this.db.table<NoteDocument>('notes')
      .where('folder', folderId)
      .where('archived', false)
      .orderByDesc('lastModified')
      .get();
  }

  /**
   * Search notes
   */
  async searchNotes(query: string): Promise<NoteDocument[]> {
    const allNotes = await this.db.table<NoteDocument>('notes')
      .where('archived', false)
      .get();

    // Search in title and content
    const lowerQuery = query.toLowerCase();
    return allNotes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get notes by tag
   */
  async getNotesByTag(tag: string): Promise<NoteDocument[]> {
    const allNotes = await this.getAllNotes();
    return allNotes.filter(note => note.tags.includes(tag));
  }

  /**
   * Get all unique tags
   */
  async getAllTags(): Promise<string[]> {
    const allNotes = await this.getAllNotes();
    const tagSet = new Set<string>();

    for (const note of allNotes) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }

    return Array.from(tagSet).sort();
  }

  /**
   * Create a folder
   */
  async createFolder(
    name: string,
    options: { icon?: string; color?: string; parent?: string } = {}
  ): Promise<FolderDocument> {
    const folder = await this.db.insert<FolderDocument>('folders', {
      name,
      icon: options.icon,
      color: options.color,
      parent: options.parent
    });

    console.log(`📁 Created folder: "${name}"`);
    return folder;
  }

  /**
   * Get all folders
   */
  async getAllFolders(): Promise<FolderDocument[]> {
    return this.db.table<FolderDocument>('folders').get();
  }

  /**
   * Move note to folder
   */
  async moveToFolder(noteId: string, folderId: string | null): Promise<void> {
    await this.updateNote(noteId, { folder: folderId || undefined });
    console.log(`📁 Moved note to ${folderId ? 'folder' : 'root'}`);
  }

  /**
   * Export notes as JSON
   */
  async exportNotes(): Promise<string> {
    const notes = await this.db.table<NoteDocument>('notes').all();
    const folders = await this.getAllFolders();

    return JSON.stringify(
      {
        version: 1,
        exportedAt: Date.now(),
        notes,
        folders
      },
      null,
      2
    );
  }

  /**
   * Import notes from JSON
   */
  async importNotes(jsonData: string): Promise<void> {
    const data = JSON.parse(jsonData);

    // Import folders first
    if (data.folders) {
      for (const folder of data.folders) {
        await this.db.insert('folders', folder);
      }
    }

    // Import notes
    if (data.notes) {
      for (const note of data.notes) {
        await this.db.insert('notes', note);
      }
    }

    console.log(`📥 Imported ${data.notes?.length || 0} notes and ${data.folders?.length || 0} folders`);
  }

  /**
   * Subscribe to note changes
   */
  subscribeToNotes(callback: (notes: NoteDocument[]) => void) {
    return this.db.table<NoteDocument>('notes')
      .where('archived', false)
      .orderByDesc('lastModified')
      .subscribe(callback);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    pinned: number;
    archived: number;
    folders: number;
    tags: number;
  }> {
    const allNotes = await this.db.table<NoteDocument>('notes').all();
    const pinnedNotes = await this.getPinnedNotes();
    const archivedNotes = await this.getArchivedNotes();
    const folders = await this.getAllFolders();
    const tags = await this.getAllTags();

    return {
      total: allNotes.length,
      pinned: pinnedNotes.length,
      archived: archivedNotes.length,
      folders: folders.length,
      tags: tags.length
    };
  }

  /**
   * Get online/offline status
   */
  isOnline(): boolean {
    return this.db.isConnected();
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    connected: boolean;
    syncing: boolean;
    lastSync: number;
  } {
    const state = this.db.getReplicationState();
    return {
      connected: this.db.isConnected(),
      syncing: this.db.isSyncing(),
      lastSync: state?.lastSyncTime || 0
    };
  }

  /**
   * Force sync
   */
  async sync(): Promise<void> {
    await this.db.sync();
  }

  /**
   * Log online status
   */
  private logOnlineStatus(): void {
    const status = this.isOnline() ? '🟢 Online' : '🔴 Offline';
    console.log(`Status: ${status}`);
  }

  /**
   * Get online indicator
   */
  private getOnlineIndicator(): string {
    return this.isOnline() ? '(synced)' : '(offline)';
  }

  /**
   * Close the database
   */
  async close(): Promise<void> {
    await this.db.close();
  }
}

/**
 * Demo usage
 */
async function demo() {
  console.log('=== Offline Notes App Demo ===\n');

  const app = new OfflineNotesApp();
  await app.init();

  console.log('\n--- Creating notes (works offline!) ---');
  const note1 = await app.createNote(
    'ElideDB Features',
    'Local-first architecture, real-time sync, offline support',
    { tags: ['database', 'features'], pinned: true }
  );

  const note2 = await app.createNote(
    'Meeting Notes',
    'Discussed project roadmap and priorities',
    { tags: ['meetings', 'work'] }
  );

  const note3 = await app.createNote(
    'Ideas',
    'Random thoughts and ideas for future projects',
    { tags: ['brainstorming'], color: 'yellow' }
  );

  console.log('\n--- Creating folders ---');
  const workFolder = await app.createFolder('Work', { icon: '💼', color: 'blue' });
  const personalFolder = await app.createFolder('Personal', { icon: '🏠', color: 'green' });

  console.log('\n--- Organizing notes ---');
  await app.moveToFolder(note2.id, workFolder.id);
  await app.moveToFolder(note3.id, personalFolder.id);

  console.log('\n--- Updating note ---');
  await app.updateNote(note1.id, {
    content: 'Local-first architecture, real-time sync, offline support, SQL queries'
  });

  console.log('\n--- Viewing all notes ---');
  const allNotes = await app.getAllNotes();
  console.log(`\nTotal notes: ${allNotes.length}`);
  allNotes.forEach(note => {
    const pin = note.pinned ? '📌 ' : '';
    const tags = note.tags.length > 0 ? ` [${note.tags.join(', ')}]` : '';
    console.log(`  ${pin}${note.title}${tags}`);
  });

  console.log('\n--- Searching notes ---');
  const searchResults = await app.searchNotes('database');
  console.log(`Search results for "database": ${searchResults.length} notes`);
  searchResults.forEach(note => {
    console.log(`  - ${note.title}`);
  });

  console.log('\n--- Viewing by folder ---');
  const workNotes = await app.getNotesByFolder(workFolder.id);
  console.log(`Work folder: ${workNotes.length} notes`);

  console.log('\n--- Getting statistics ---');
  const stats = await app.getStats();
  console.log('Stats:', stats);

  console.log('\n--- Real-time subscription ---');
  const subscription = app.subscribeToNotes((notes) => {
    console.log(`[Real-time] Note count: ${notes.length}`);
  });

  // Make a change
  await app.createNote('New Note', 'This triggers the subscription', { tags: ['test'] });

  // Wait for update
  await new Promise(resolve => setTimeout(resolve, 1000));

  subscription.unsubscribe();

  console.log('\n--- Archiving note ---');
  await app.toggleArchive(note3.id);

  console.log('\n--- Exporting notes ---');
  const exported = await app.exportNotes();
  console.log(`Exported ${JSON.parse(exported).notes.length} notes`);

  console.log('\n--- Cleanup ---');
  await app.close();

  console.log('\nDemo completed!');
}

// Run demo if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { OfflineNotesApp, NoteDocument, FolderDocument };
