import { SavedSongProject, LyricLine, AudioTrack } from '../types/clip';
import { SONG_LYRICS, AUDIO_FILE_PATH, PRESET_AUDIO_TRACKS } from '../data/songData';

const DB_NAME = 'GuaraFoodAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioBlobs';
const STORAGE_KEY_PROJECTS = 'guarafood_saved_songs_v1';

// Open or initialize IndexedDB for binary audio blobs
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Store an audio Blob/File in IndexedDB
export async function saveAudioBlob(trackId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, trackId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Failed to save audio blob to IndexedDB:', err);
  }
}

// Retrieve an audio Blob from IndexedDB and convert to ObjectURL
export async function getAudioBlobUrl(trackId: string): Promise<string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(trackId);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        const blob = request.result as Blob;
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Delete audio Blob from IndexedDB
export async function deleteAudioBlob(trackId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(trackId);
  } catch {
    // Ignore error
  }
}

// Default initial projects list
export const DEFAULT_SAVED_PROJECTS: SavedSongProject[] = [
  {
    id: 'project-jingle-oficial',
    title: 'GuaraFood Jingle Oficial (Vocal Completo)',
    artist: 'GuaraFood Produções',
    audioUrl: AUDIO_FILE_PATH,
    duration: 67,
    lyrics: SONG_LYRICS,
    createdAt: 1731000000000,
    updatedAt: 1731000000000,
    isPreset: true,
  },
  {
    id: 'project-jingle-sertanejo',
    title: 'Jingle Guaranésia Sertanejo Animado',
    artist: 'GuaraFood Beats',
    audioUrl: AUDIO_FILE_PATH,
    duration: 67,
    lyrics: [
      { id: 's1', startTime: 0, endTime: 3.5, text: 'Bateu a fome em Guaranésia, chama o GuaraFood!', section: 'intro' },
      { id: 's2', startTime: 3.5, endTime: 7, text: 'Pizza quentinha no forno e o hambúrguer no ponto!', section: 'verse' },
      { id: 's3', startTime: 7, endTime: 11, text: 'Entrega rápida na sua porta com quem investe aqui!', section: 'verse' },
      { id: 's4', startTime: 11, endTime: 16, text: 'GuaraFood! Da nossa cidade direto pra você!', section: 'chorus' },
    ],
    createdAt: 1731000000000,
    updatedAt: 1731000000000,
    isPreset: true,
  },
];

// Load saved projects list from localStorage
export function loadSavedProjects(): SavedSongProject[] {
  if (typeof window === 'undefined') return DEFAULT_SAVED_PROJECTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(DEFAULT_SAVED_PROJECTS));
      return DEFAULT_SAVED_PROJECTS;
    }
    const parsed = JSON.parse(raw) as SavedSongProject[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SAVED_PROJECTS;
  } catch {
    return DEFAULT_SAVED_PROJECTS;
  }
}

// Save projects list to localStorage
export function persistProjects(projects: SavedSongProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (err) {
    console.warn('Could not persist projects to localStorage:', err);
  }
}

// Export a song project to downloadable JSON file
export function exportProjectToJsonFile(project: SavedSongProject): void {
  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = project.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.href = url;
  a.download = `guarafood_musica_letra_${safeTitle}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export lyrics to .LRC format (universal karaoke file)
export function exportLyricsToLrcFile(title: string, artist: string, lyrics: LyricLine[]): void {
  let lrcContent = `[ti:${title}]\n[ar:${artist}]\n[al:GuaraFood Delivery Guaranésia]\n[by:GuaraFood Studio]\n\n`;

  lyrics.forEach((line) => {
    const mins = Math.floor(line.startTime / 60);
    const secs = Math.floor(line.startTime % 60);
    const centis = Math.floor((line.startTime % 1) * 100);
    const timeTag = `[${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}]`;
    lrcContent += `${timeTag}${line.text}\n`;
  });

  const blob = new Blob([lrcContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  a.href = url;
  a.download = `letra_${safeTitle}.lrc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse imported JSON project
export function parseProjectJson(jsonString: string): SavedSongProject | null {
  try {
    const obj = JSON.parse(jsonString);
    if (obj && typeof obj.title === 'string' && Array.isArray(obj.lyrics)) {
      return {
        id: obj.id || `imported-${Date.now()}`,
        title: obj.title,
        artist: obj.artist || 'Artista Importado',
        audioUrl: obj.audioUrl || AUDIO_FILE_PATH,
        duration: obj.duration || 67,
        lyrics: obj.lyrics.map((l: any, i: number) => ({
          id: l.id || `lyric-${i + 1}-${Date.now()}`,
          startTime: typeof l.startTime === 'number' ? l.startTime : i * 3,
          endTime: typeof l.endTime === 'number' ? l.endTime : (i + 1) * 3,
          text: l.text || '',
          section: l.section || 'verse',
          highlightWord: l.highlightWord,
        })),
        createdAt: obj.createdAt || Date.now(),
        updatedAt: Date.now(),
      };
    }
    return null;
  } catch {
    return null;
  }
}
