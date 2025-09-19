import Dexie, { type Table } from 'dexie';

interface Token {
  id: string;
  value: string;
}

interface User {
  id: string;
  value: string; // You can also type this if needed
}

class AgentAuthDB extends Dexie {
  tokens!: Table<Token>;
  users!: Table<User>;

  constructor() {
    super("agentActAuthDB");
    this.version(2).stores({
      tokens: 'id',
      users: 'id',
    });
  }
}

export const db = new AgentAuthDB();

export async function initializeDB() {
  try {
    // Force table access to trigger initialization
    const dbs = await indexedDB.databases?.();
    const exists = dbs?.some(d => d.name === "agentActAuthDB");
    if (!exists) {
      await db.open();
    }
    await db.tokens.toArray();
    await db.users.toArray();
    console.log("Database initialized (or already exists)");
  } catch (err) {
    console.error("Failed to initialize DB:", err);
  }
}