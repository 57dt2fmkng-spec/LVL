import { useEffect, useState } from 'react';

interface Status {
  standalone: boolean;
  persisted: boolean | null;
  usage: number | null;
  quota: number | null;
  serviceWorker: boolean;
  share: boolean;
}

const mb = (n: number | null) => (n == null ? 'unbekannt' : `${(n / 1048576).toFixed(n < 10485760 ? 2 : 0)} MB`);

/** Prüfanzeige für Schritt 0: zeigt, ob die Voraussetzungen auf diesem Gerät erfüllt sind. */
export function SystemStatus() {
  const [s, setS] = useState<Status | null>(null);

  const check = async (request: boolean) => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let persisted: boolean | null = null;
    let usage: number | null = null;
    let quota: number | null = null;
    try {
      if (navigator.storage?.persisted) {
        persisted = await navigator.storage.persisted();
        if (!persisted && request && navigator.storage.persist) persisted = await navigator.storage.persist();
      }
      const est = await navigator.storage?.estimate?.();
      usage = est?.usage ?? null;
      quota = est?.quota ?? null;
    } catch {
      /* Angaben bleiben unbekannt */
    }
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    setS({ standalone, persisted, usage, quota, serviceWorker: !!reg?.active, share: typeof navigator.canShare === 'function' });
  };

  useEffect(() => void check(true), []);
  if (!s) return null;

  const yn = (v: boolean | null, yes: string, no: string) =>
    v == null ? <span className="v">unbekannt</span> : <span className={`v ${v ? 'ok' : 'warn'}`}>{v ? yes : no}</span>;

  return (
    <section className="card">
      <div className="row"><span>Installiert (Home-Bildschirm)</span>{yn(s.standalone, 'ja', 'nein, im Browser')}</div>
      <div className="row"><span>Offline-Betrieb</span>{yn(s.serviceWorker, 'bereit', 'noch nicht aktiv')}</div>
      <div className="row"><span>Dauerhafter Speicher</span>{yn(s.persisted, 'zugesichert', 'nicht zugesichert')}</div>
      <div className="row"><span>Belegter Speicher</span><span className="v">{mb(s.usage)}</span></div>
      <div className="row"><span>Verfügbarer Speicher</span><span className="v">{mb(s.quota)}</span></div>
      <div className="row"><span>Teilen-Dialog für Dateien</span>{yn(s.share, 'verfügbar', 'nicht verfügbar')}</div>
      <div className="row"><span>App-Version</span><span className="v">0.1.0 · Schritt 0</span></div>
      <button className="btn" onClick={() => void check(true)}>Erneut prüfen</button>
    </section>
  );
}
