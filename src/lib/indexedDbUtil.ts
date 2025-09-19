import Dexie from "dexie";

/**
 * Fetches a value from a Dexie-managed IndexedDB store.
 * Assumes each item in the store has shape: { id: string, value: T }
 */
export async function fetchFromIndexedDB<T = any>(
    dbName: string,
    storeName: string,
    key: string // use `string` or `number` explicitly
): Promise<T | undefined> {
    const db = new Dexie(dbName);

    // Define dynamic schema
    db.version(1).stores({
        [storeName]: "id",
    });

    try {
        const record = await db
            .table<{ id: string; value: T }>(storeName)
            .get(key);
        return record?.value;
    } catch (error) {
        console.error(`Error fetching from ${storeName} by key ${key}:`, error);
        throw error;
    } finally {
        db.close();
    }
}

/**
 * Stores a value in IndexedDB using Dexie.
 * @param dbName The name of the database.
 * @param storeName The name of the object store.
 * @param key The key to store the value under.
 * @param value The value to store.
 */
export async function storeInIndexedDB<T = any>(
    dbName: string,
    storeName: string,
    key: IDBValidKey,
    value: T
): Promise<void> {
    // Dynamically create a Dexie instance
    const db = new Dexie(dbName);

    db.version(1).stores({
        [storeName]: "id", // assumes the store uses 'id' as keyPath
    });

    try {
        // Add or update the value with the given key
        await db.table(storeName).put({ id: key, value });
        Promise.resolve();
    } catch (error) {
        console.error(
            `Dexie store error in ${storeName} -> ${String(key)}`,
            error
        );
        throw error;
    } finally {
        db.close();
    }
}
