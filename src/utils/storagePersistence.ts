import type { WorkspaceData } from '../types/productivity';

export const STORAGE_KEY = 'anchordesk_student_tracker_v2';
const IDB_NAME = 'anchordesk_db';
const IDB_STORE = 'workspace';
const IDB_RECORD_KEY = 'current';

export function saveToLocalStorage(data: WorkspaceData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalStorage(): WorkspaceData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseImportedWorkspaceJson(raw);
    return parsed.ok ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function saveToIndexedDb(data: WorkspaceData): Promise<boolean> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return false;
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readwrite');
          tx.objectStore(IDB_STORE).put(data, IDB_RECORD_KEY);
          tx.oncomplete = () => {
            db.close();
            resolve(true);
          };
          tx.onerror = () => {
            db.close();
            resolve(false);
          };
        } catch {
          resolve(false);
        }
      };
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function loadFromIndexedDb(): Promise<WorkspaceData | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => {
        try {
          const db = req.result;
          const tx = db.transaction(IDB_STORE, 'readonly');
          const getReq = tx.objectStore(IDB_STORE).get(IDB_RECORD_KEY);
          getReq.onsuccess = () => {
            const val = getReq.result;
            db.close();
            if (val && typeof val === 'object') {
              const normalized = parseImportedWorkspaceJson(JSON.stringify(val));
              resolve(normalized.ok ? normalized.data : null);
            } else {
              resolve(null);
            }
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      };
      req.onerror = () => resolve(false as unknown as null);
    } catch {
      resolve(null);
    }
  });
}

export function parseImportedWorkspaceJson(
  raw: string,
): { ok: true; data: WorkspaceData } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceData>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.mustDos) ||
      !Array.isArray(parsed.focusSessions)
    ) {
      return {
        ok: false,
        error: 'This file does not look like a valid AnchorDesk backup.',
      };
    }

    return {
      ok: true,
      data: {
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        dailyPhoneLimitMinutes:
          typeof parsed.dailyPhoneLimitMinutes === 'number' &&
          parsed.dailyPhoneLimitMinutes >= 15
            ? parsed.dailyPhoneLimitMinutes
            : 90,
        mustDos: parsed.mustDos,
        smallTasks: Array.isArray(parsed.smallTasks) ? parsed.smallTasks : [],
        focusSessions: parsed.focusSessions,
        phoneLogs:
          parsed.phoneLogs && typeof parsed.phoneLogs === 'object'
            ? parsed.phoneLogs
            : {},
        replacementActivities: Array.isArray(parsed.replacementActivities)
          ? parsed.replacementActivities
          : ['Walk', 'Stretch', 'Read', 'Text a friend'],
        dailyReviews:
          parsed.dailyReviews && typeof parsed.dailyReviews === 'object'
            ? parsed.dailyReviews
            : {},
        weeklyReviews: Array.isArray(parsed.weeklyReviews)
          ? parsed.weeklyReviews
          : [],
        plannedNightBeforeDates: Array.isArray(parsed.plannedNightBeforeDates)
          ? parsed.plannedNightBeforeDates
          : [],
      },
    };
  } catch {
    return {
      ok: false,
      error: 'Could not read JSON file. Make sure it is an AnchorDesk .json backup.',
    };
  }
}
