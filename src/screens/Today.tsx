import { useEffect, useState } from 'react';
import { type Character, getCharacter, getValue } from '../data/db';
import { IconSettings } from '../icons';

export const LAST_EXPORT_KEY = 'lastExportAt';
const BACKUP_HINT_DAYS = 14;

export function Today({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [backupDue, setBackupDue] = useState(false);

  useEffect(() => {
    void (async () => {
      const c = await getCharacter();
      setCharacter(c);
      const last = await getValue<string>(LAST_EXPORT_KEY);
      const reference = last ?? c.createdAt;
      setBackupDue(Date.now() - Date.parse(reference) > BACKUP_HINT_DAYS * 864e5);
    })();
  }, []);

  return (
    <>
      <div className="head">
        <h1>Heute</h1>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="Einstellungen">
          <IconSettings />
        </button>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <div className="level">
          <span className="n">1</span>
          <span className="l">Level</span>
        </div>
        <div style={{ marginTop: 6, fontWeight: 600 }}>{character?.name || 'Charakter ohne Namen'}</div>
        <div className="bar">
          <i style={{ width: '0%' }} />
        </div>
        <div className="muted">0 / 100 EP bis Level 2</div>
      </section>

      {backupDue && (
        <section className="card">
          <b>Sicherung empfohlen</b>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Die letzte Sicherung liegt mehr als {BACKUP_HINT_DAYS} Tage zurück.
          </p>
          <button className="btn" onClick={onOpenSettings}>
            Zur Sicherung
          </button>
        </section>
      )}

      <h2>Aktive Quests</h2>
      <div className="card muted">Noch keine Quests. Folgt in Schritt 3.</div>
      <h2>Streaks</h2>
      <div className="card muted">Noch keine Streaks. Folgt in Schritt 6.</div>
    </>
  );
}
