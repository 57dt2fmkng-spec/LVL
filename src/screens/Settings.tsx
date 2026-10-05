import { useEffect, useRef, useState } from 'react';
import { type Character, db, getCharacter, getValue, setValue } from '../data/db';
import { PasswordRequiredError, exportAll, importAll, parseBackupFile, serializeBackup } from '../data/backup';
import { IconBack } from '../icons';
import { LAST_EXPORT_KEY } from './Today';
import { SystemStatus } from './SystemStatus';

type Msg = { kind: 'ok' | 'bad'; text: string } | null;

async function deliverFile(name: string, text: string) {
  const file = new File([text], name, { type: 'application/json' });
  // Auf dem iPhone führt der Teilen-Dialog zuverlässig zu „In Dateien sichern“; sonst normaler Download.
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return true;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

async function restoreLastExport(previous: string | undefined) {
  if (previous) await setValue(LAST_EXPORT_KEY, previous);
  else await db.kv.delete(LAST_EXPORT_KEY);
}

export function Settings({ onBack }: { onBack: () => void }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [lastExport, setLastExport] = useState<string | undefined>();
  const [exportPw, setExportPw] = useState('');
  const [importPw, setImportPw] = useState('');
  const [pending, setPending] = useState<{ name: string; text: string } | null>(null);
  const [needsPw, setNeedsPw] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    setCharacter(await getCharacter());
    setLastExport(await getValue<string>(LAST_EXPORT_KEY));
  };
  useEffect(() => void reload(), []);

  const update = async (patch: Partial<Character>) => {
    // Funktionale Aktualisierung und Teil-Update in der Datenbank: schnelle Eingaben überschreiben einander nicht.
    setCharacter((c) => (c ? { ...c, ...patch } : c));
    await db.character.update('me', patch);
  };

  const doExport = async () => {
    setBusy(true);
    setMsg(null);
    const previous = await getValue<string>(LAST_EXPORT_KEY);
    const now = new Date().toISOString();
    try {
      // Zeitpunkt vor dem Auslesen setzen, damit die Sicherung ihren eigenen Stand enthält.
      await setValue(LAST_EXPORT_KEY, now);
      const text = await serializeBackup(await exportAll(db), exportPw || undefined);
      if (await deliverFile(`life-leveling-sicherung-${now.slice(0, 10)}.json`, text)) {
        setLastExport(now);
        setMsg({ kind: 'ok', text: exportPw ? 'Verschlüsselte Sicherung erstellt.' : 'Sicherung erstellt.' });
      } else {
        await restoreLastExport(previous);
      }
    } catch (e) {
      await restoreLastExport(previous);
      setMsg({ kind: 'bad', text: (e as Error).message });
    }
    setBusy(false);
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setMsg(null);
    setNeedsPw(false);
    setImportPw('');
    setPending({ name: f.name, text: await f.text() });
  };

  const doImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await importAll(db, await parseBackupFile(pending.text, importPw || undefined));
      setPending(null);
      setNeedsPw(false);
      await reload();
      setMsg({ kind: 'ok', text: 'Sicherung eingelesen. Der bisherige Bestand wurde ersetzt.' });
    } catch (e) {
      if (e instanceof PasswordRequiredError) setNeedsPw(true);
      setMsg({ kind: 'bad', text: (e as Error).message });
    }
    setBusy(false);
  };

  return (
    <>
      <div className="head" style={{ justifyContent: 'flex-start', gap: 4, marginLeft: -12 }}>
        <button className="icon-btn" onClick={onBack} aria-label="Zurück">
          <IconBack />
        </button>
        <h1>Einstellungen</h1>
      </div>

      <h2>Stammdaten</h2>
      <section className="card">
        <label htmlFor="name">Name des Charakters</label>
        <input id="name" type="text" value={character?.name ?? ''} onChange={(e) => void update({ name: e.target.value })} />
        <label htmlFor="height">Körpergröße in cm (für den BMI)</label>
        <input
          id="height"
          type="number"
          inputMode="decimal"
          min={100}
          max={250}
          value={character?.heightCm ?? ''}
          onChange={(e) => void update({ heightCm: e.target.value === '' ? null : Number(e.target.value) })}
        />
        <p className="muted" style={{ margin: '10px 0 0' }}>Eingaben werden sofort auf diesem Gerät gespeichert.</p>
      </section>

      <h2>Sicherung</h2>
      <section className="card">
        <p className="muted">
          Alle Daten liegen ausschließlich auf diesem Gerät. Die Sicherungsdatei ist der einzige Schutz bei Gerätewechsel
          oder Datenverlust.
        </p>
        <div className="row">
          <span>Letzte Sicherung</span>
          <span className="v">{lastExport ? new Date(lastExport).toLocaleString('de-DE') : 'noch keine'}</span>
        </div>
        <label htmlFor="exportPw">Passwort (optional, verschlüsselt die Datei)</label>
        <input id="exportPw" type="password" autoComplete="new-password" value={exportPw} onChange={(e) => setExportPw(e.target.value)} />
        <button className="btn primary" disabled={busy} onClick={() => void doExport()}>
          Sicherung erstellen
        </button>
        <button className="btn" disabled={busy} onClick={() => fileRef.current?.click()}>
          Sicherung einlesen
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => void onFile(e)} />

        {pending && (
          <div style={{ marginTop: 14 }}>
            <p>
              <b>{pending.name}</b> einlesen? Der gesamte aktuelle Bestand wird durch die Sicherung ersetzt.
            </p>
            {needsPw && (
              <>
                <label htmlFor="importPw">Passwort der Sicherung</label>
                <input id="importPw" type="password" value={importPw} onChange={(e) => setImportPw(e.target.value)} />
              </>
            )}
            <button className="btn danger" disabled={busy} onClick={() => void doImport()}>
              Bestand ersetzen
            </button>
            <button className="btn" onClick={() => { setPending(null); setMsg(null); }}>
              Abbrechen
            </button>
          </div>
        )}
        {msg && <p className={`msg ${msg.kind}`}>{msg.text}</p>}
      </section>

      <h2>Systemstatus</h2>
      <SystemStatus />
    </>
  );
}
