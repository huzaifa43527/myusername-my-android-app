/**
 * Local IndexedDB Storage Engine for Smart Trip Tracker.
 * Provides resilient, quota-resistant offline persistence for trips, fuel logs,
 * vehicle records, maintenance items, and user settings.
 */

const DB_NAME = 'SmartTripTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'keyval_store';

export const IDB_KEYS = {
  VEHICLES: 'vehicles',
  TRIPS: 'trips',
  FUEL_LOGS: 'fuel_logs',
  MAINTENANCE: 'maintenance',
  SAVED_LOCATIONS: 'saved_locations',
  SETTINGS: 'settings',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported on this device/browser'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = (event) => {
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

/**
 * Retrieve item by key from IndexedDB
 */
export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    return new Promise<T | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to get key "${key}":`, err);
    return null;
  }
}

/**
 * Store an item by key in IndexedDB
 */
export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to set key "${key}":`, err);
  }
}

/**
 * Remove an item from IndexedDB
 */
export async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`[IndexedDB] Failed to delete key "${key}":`, err);
  }
}

/**
 * Clear all data inside the store
 */
export async function idbClear(): Promise<void> {
  try {
    const db = await getDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to clear store:', err);
  }
}
