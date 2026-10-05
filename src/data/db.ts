import Dexie, { type Table } from 'dexie';

/** Stammdaten des Charakters. EP und Level werden ab Schritt 3 aus dem EP-Journal berechnet, nicht gespeichert. */
export interface Character {
  id: 'me';
  name: string;
  heightCm: number | null;
  activeTitleId: string | null;
  createdAt: string;
}

/** Schlüssel-Wert-Ablage für App-Zustand (z. B. Zeitpunkt der letzten Sicherung). */
export interface KeyValue {
  key: string;
  value: unknown;
}

export class LvlDb extends Dexie {
  character!: Table<Character, string>;
  kv!: Table<KeyValue, string>;

  constructor(name = 'life-leveling') {
    super(name);
    // Schemaversionen werden nur ergänzt, nie rückwirkend geändert (Migrationen über .upgrade()).
    this.version(1).stores({
      character: 'id',
      kv: 'key',
    });
  }
}

export const db = new LvlDb();

export async function getCharacter(d: LvlDb = db): Promise<Character> {
  const existing = await d.character.get('me');
  if (existing) return existing;
  const fresh: Character = {
    id: 'me',
    name: '',
    heightCm: null,
    activeTitleId: null,
    createdAt: new Date().toISOString(),
  };
  await d.character.put(fresh);
  return fresh;
}

export async function getValue<T>(key: string, d: LvlDb = db): Promise<T | undefined> {
  return (await d.kv.get(key))?.value as T | undefined;
}

export async function setValue(key: string, value: unknown, d: LvlDb = db): Promise<void> {
  await d.kv.put({ key, value });
}
