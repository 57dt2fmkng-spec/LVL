import type Dexie from 'dexie';
import { decryptText, encryptText, isEncryptedEnvelope } from './crypto';

export const BACKUP_FORMAT = 'life-leveling-backup';
export const BACKUP_FORMAT_VERSION = 1;

export interface Backup {
  format: typeof BACKUP_FORMAT;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

/** Liest alle Tabellen der Datenbank aus. Neue Tabellen werden ohne Anpassung miterfasst. */
export async function exportAll(d: Dexie): Promise<Backup> {
  const tables: Record<string, unknown[]> = {};
  for (const t of d.tables) tables[t.name] = await t.toArray();
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: d.verno,
    exportedAt: new Date().toISOString(),
    tables,
  };
}

export function validateBackup(x: unknown): asserts x is Backup {
  const b = x as Partial<Backup> | null;
  if (!b || b.format !== BACKUP_FORMAT) throw new Error('Die Datei ist keine Sicherung dieser App.');
  if (typeof b.formatVersion !== 'number' || b.formatVersion > BACKUP_FORMAT_VERSION)
    throw new Error('Die Sicherung stammt aus einer neueren App-Version.');
  if (!b.tables || typeof b.tables !== 'object') throw new Error('Die Sicherung enthält keine Daten.');
  for (const rows of Object.values(b.tables))
    if (!Array.isArray(rows)) throw new Error('Die Sicherung ist beschädigt.');
}

/**
 * Ersetzt den gesamten Datenbestand durch die Sicherung. Läuft in einer Transaktion:
 * Bei einem Fehler bleibt der bisherige Bestand unverändert.
 */
export async function importAll(d: Dexie, backup: unknown): Promise<void> {
  validateBackup(backup);
  if (backup.schemaVersion > d.verno) throw new Error('Die Sicherung stammt aus einer neueren App-Version.');
  await d.transaction('rw', d.tables, async () => {
    for (const t of d.tables) {
      await t.clear();
      const rows = backup.tables[t.name];
      if (rows?.length) await t.bulkPut(rows);
    }
  });
}

export async function serializeBackup(backup: Backup, password?: string): Promise<string> {
  const json = JSON.stringify(backup);
  return password ? JSON.stringify(await encryptText(json, password)) : json;
}

export async function parseBackupFile(text: string, password?: string): Promise<unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist nicht lesbar.');
  }
  if (isEncryptedEnvelope(parsed)) {
    if (!password) throw new PasswordRequiredError();
    return JSON.parse(await decryptText(parsed, password));
  }
  return parsed;
}

export class PasswordRequiredError extends Error {
  constructor() {
    super('Die Sicherung ist verschlüsselt. Bitte Passwort eingeben.');
  }
}
