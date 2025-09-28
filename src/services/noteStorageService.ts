import * as SecureStore from 'expo-secure-store';
import type { BobsNote } from './zkETHerEventListener';

export interface StoredNote extends BobsNote {
  id: string;
  isSelected?: boolean;
}

class NoteStorageService {
  private readonly NOTES_KEY = 'zkether_bobs_notes';
  private readonly MAX_NOTES = 2; // Hackathon limit

  /**
   * Store Bob's notes securely
   */
  async storeNotes(notes: BobsNote[]): Promise<void> {
    try {
      const storedNotes: StoredNote[] = notes.map((note, index) => ({
        ...note,
        id: `note_${Date.now()}_${index}`
      }));

      await SecureStore.setItemAsync(
        this.NOTES_KEY,
        JSON.stringify(storedNotes),
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );

      console.log(`💾 Stored ${notes.length} notes securely`);
    } catch (error) {
      console.error('❌ Failed to store notes:', error);
      throw error;
    }
  }

  /**
   * Retrieve Bob's stored notes
   */
  async getNotes(): Promise<StoredNote[]> {
    try {
      const notesJson = await SecureStore.getItemAsync(this.NOTES_KEY);
      if (!notesJson) return [];

      const notes: StoredNote[] = JSON.parse(notesJson);
      return notes.filter(note => note.status === 'available');
    } catch (error) {
      console.error('❌ Failed to retrieve notes:', error);
      return [];
    }
  }

  /**
   * Add a new note
   */
  async addNote(note: BobsNote): Promise<void> {
    try {
      const existingNotes = await this.getNotes();
      
      // Check hackathon limit
      if (existingNotes.length >= this.MAX_NOTES) {
        console.log(`⚠️ Reached hackathon limit of ${this.MAX_NOTES} notes`);
        return;
      }

      // Check if note already exists
      const exists = existingNotes.some(n => n.commitment === note.commitment);
      if (exists) {
        console.log('⚠️ Note already exists:', note.commitment.slice(0, 10) + '...');
        return;
      }

      const newNote: StoredNote = {
        ...note,
        id: `note_${Date.now()}_${existingNotes.length}`
      };

      const updatedNotes = [...existingNotes, newNote];
      await this.storeNotes(updatedNotes);

      console.log('✅ New note added:', {
        id: newNote.id,
        amount: newNote.amount,
        commitment: newNote.commitment.slice(0, 10) + '...'
      });
    } catch (error) {
      console.error('❌ Failed to add note:', error);
      throw error;
    }
  }

  /**
   * Mark a note as spent
   */
  async markNoteAsSpent(commitment: string): Promise<void> {
    try {
      const notes = await this.getAllNotes(); // Get all notes including spent ones
      const noteIndex = notes.findIndex(n => n.commitment === commitment);
      
      if (noteIndex === -1) {
        console.log('⚠️ Note not found:', commitment.slice(0, 10) + '...');
        return;
      }

      notes[noteIndex].status = 'spent';
      await this.storeNotes(notes);

      console.log('✅ Note marked as spent:', commitment.slice(0, 10) + '...');
    } catch (error) {
      console.error('❌ Failed to mark note as spent:', error);
      throw error;
    }
  }

  /**
   * Get all notes (including spent ones)
   */
  async getAllNotes(): Promise<StoredNote[]> {
    try {
      const notesJson = await SecureStore.getItemAsync(this.NOTES_KEY);
      if (!notesJson) return [];

      return JSON.parse(notesJson);
    } catch (error) {
      console.error('❌ Failed to retrieve all notes:', error);
      return [];
    }
  }

  /**
   * Clear all notes (for testing)
   */
  async clearNotes(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.NOTES_KEY);
      console.log('🗑️ All notes cleared');
    } catch (error) {
      console.error('❌ Failed to clear notes:', error);
      throw error;
    }
  }

  /**
   * Get notes count
   */
  async getNotesCount(): Promise<{ available: number; total: number; maxNotes: number }> {
    try {
      const allNotes = await this.getAllNotes();
      const availableNotes = allNotes.filter(note => note.status === 'available');
      
      return {
        available: availableNotes.length,
        total: allNotes.length,
        maxNotes: this.MAX_NOTES
      };
    } catch (error) {
      console.error('❌ Failed to get notes count:', error);
      return { available: 0, total: 0, maxNotes: this.MAX_NOTES };
    }
  }

  /**
   * Format note for display
   */
  formatNoteForDisplay(note: StoredNote): {
    id: string;
    title: string;
    amount: string;
    timeAgo: string;
    privacySet: string;
    status: string;
    isRecommended: boolean;
  } {
    const receivedDate = new Date(note.receivedAt);
    const now = new Date();
    const diffMs = now.getTime() - receivedDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo: string;
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'Just now';
    }

    // Generate privacy set (mock for hackathon)
    const privacySet = `${47000 + Math.floor(Math.random() * 1000)},${Math.floor(Math.random() * 1000)}`;

    return {
      id: note.id,
      title: `Note #${note.leafIndex + 1}`,
      amount: `${note.amount} ETH`,
      timeAgo: `Received: ${timeAgo}`,
      privacySet: `Privacy Set: ${privacySet}`,
      status: note.status,
      isRecommended: diffHours >= 5 // Recommend notes older than 5 hours
    };
  }
}

export const noteStorageService = new NoteStorageService();
