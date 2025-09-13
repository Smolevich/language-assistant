const DB_NAME = 'la_duckdb_store_v1';
const STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet(name: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const getReq = store.get(name);
      getReq.onsuccess = () => {
        const val = getReq.result;
        if (val instanceof ArrayBuffer) resolve(val);
        else if (val && val.buffer) resolve(val.buffer as ArrayBuffer);
        else resolve(null);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return null;
  }
}

export async function idbPut(name: string, data: ArrayBuffer): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const putReq = store.put(data, name);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });
  } catch {
    // ignore
  }
}

export async function idbDelete(name: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const delReq = store.delete(name);
      delReq.onsuccess = () => resolve();
      delReq.onerror = () => reject(delReq.error);
    });
  } catch {
    // ignore
  }
}

export async function idbGetText(name: string): Promise<string | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const getReq = store.get(name);
      getReq.onsuccess = () => {
        const val = getReq.result;
        if (typeof val === 'string') resolve(val);
        else if (val instanceof ArrayBuffer) resolve(new TextDecoder().decode(new Uint8Array(val)));
        else if (val && val.buffer) resolve(new TextDecoder().decode(new Uint8Array(val.buffer)));
        else resolve(null);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch {
    return null;
  }
}

export async function idbPutText(name: string, text: string): Promise<void> {
  const buf = new TextEncoder().encode(text);
  await idbPut(name, buf.buffer);
}
