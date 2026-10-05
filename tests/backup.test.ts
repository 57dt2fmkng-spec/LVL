import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { LvlDb, getCharacter, setValue } from '../src/data/db';
import { PasswordRequiredError, exportAll, importAll, parseBackupFile, serializeBackup } from '../src/data/backup';

let n = 0;
const freshDb = () => new LvlDb(`test-${++n}`);

async function seeded() {
  const d = freshDb();
  const c = await getCharacter(d);
  await d.character.put({ ...c, name: 'Testcharakter', heightCm: 182 });
  await setValue('demo', { a: 1, list: [1, 2, 3] }, d);
  return d;
}

describe('Sicherung', () => {
  it('Export und Import stellen den Bestand vollständig wieder her', async () => {
    const source = await seeded();
    const text = await serializeBackup(await exportAll(source));
    const target = freshDb();
    await importAll(target, await parseBackupFile(text));
    expect(await target.character.toArray()).toEqual(await source.character.toArray());
    expect(await target.kv.toArray()).toEqual(await source.kv.toArray());
  });

  it('Import ersetzt vorhandene Daten statt sie zu mischen', async () => {
    const source = await seeded();
    const target = freshDb();
    await setValue('alt', true, target);
    await importAll(target, await exportAll(source));
    expect(await target.kv.get('alt')).toBeUndefined();
  });

  it('verschlüsselte Sicherung: Klartext nicht enthalten, richtiges Passwort öffnet, falsches nicht', async () => {
    const source = await seeded();
    const text = await serializeBackup(await exportAll(source), 'geheim-123');
    expect(text).not.toContain('Testcharakter');
    await expect(parseBackupFile(text)).rejects.toBeInstanceOf(PasswordRequiredError);
    await expect(parseBackupFile(text, 'falsch')).rejects.toThrow(/Passwort/);
    const target = freshDb();
    await importAll(target, await parseBackupFile(text, 'geheim-123'));
    expect((await target.character.get('me'))?.heightCm).toBe(182);
  });

  it('fremde oder beschädigte Dateien werden abgelehnt, der Bestand bleibt unverändert', async () => {
    const target = await seeded();
    await expect(importAll(target, { foo: 1 })).rejects.toThrow();
    await expect(parseBackupFile('kein json')).rejects.toThrow();
    await expect(
      importAll(target, { format: 'life-leveling-backup', formatVersion: 1, schemaVersion: 1, exportedAt: '', tables: { character: [{ ohneId: true }] } }),
    ).rejects.toThrow();
    expect((await target.character.get('me'))?.name).toBe('Testcharakter');
  });

  it('Sicherungen aus neueren Versionen werden abgelehnt', async () => {
    const target = freshDb();
    const b = await exportAll(await seeded());
    await expect(importAll(target, { ...b, schemaVersion: 99 })).rejects.toThrow(/neueren/);
  });
});
