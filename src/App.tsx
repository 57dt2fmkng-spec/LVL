import { useState } from 'react';
import { IconAreas, IconChronicle, IconPlus, IconQuests, IconToday } from './icons';
import { Today } from './screens/Today';
import { Placeholder } from './screens/Placeholder';
import { Settings } from './screens/Settings';

type Tab = 'today' | 'quests' | 'areas' | 'chronicle';
type View = Tab | 'settings';

const CAPTURE_ITEMS: [string, string][] = [
  ['Aktivität', 'Schritt 5'],
  ['Daily Check-in', 'Schritt 5'],
  ['Weekly Check', 'Schritt 5'],
  ['Messwert', 'Schritt 4'],
  ['Quest abschließen', 'Schritt 3'],
];

export function App() {
  const [view, setView] = useState<View>('today');
  const [sheet, setSheet] = useState(false);

  const tab = (id: Tab, label: string, icon: React.ReactNode) => (
    <button className={`tab${view === id ? ' on' : ''}`} onClick={() => setView(id)} aria-current={view === id}>
      {icon}
      {label}
    </button>
  );

  return (
    <div className="app">
      <main className="screen">
        {view === 'today' && <Today onOpenSettings={() => setView('settings')} />}
        {view === 'quests' && (
          <Placeholder title="Quests" headline="Noch keine Quests" text="Quest-Katalog, Ränge und EP folgen in Schritt 3." />
        )}
        {view === 'areas' && (
          <Placeholder title="Bereiche" headline="Noch keine Bereiche" text="Lebensbereiche und Skills folgen in Schritt 4." />
        )}
        {view === 'chronicle' && (
          <Placeholder title="Chronik" headline="Noch keine Einträge" text="Achievements, Titel und Belohnungen folgen in Schritt 6." />
        )}
        {view === 'settings' && <Settings onBack={() => setView('today')} />}
      </main>

      <nav className="tabs" aria-label="Hauptnavigation">
        {tab('today', 'Heute', <IconToday />)}
        {tab('quests', 'Quests', <IconQuests />)}
        <button className="plus" onClick={() => setSheet(true)} aria-label="Erfassen">
          <IconPlus />
        </button>
        {tab('areas', 'Bereiche', <IconAreas />)}
        {tab('chronicle', 'Chronik', <IconChronicle />)}
      </nav>

      {sheet && (
        <div className="sheet-bg" onClick={() => setSheet(false)}>
          <div className="sheet" role="dialog" aria-label="Erfassen" onClick={(e) => e.stopPropagation()}>
            <h3>Erfassen</h3>
            <p className="muted">Die Eingabewege werden mit den folgenden Schritten freigeschaltet.</p>
            {CAPTURE_ITEMS.map(([name, step]) => (
              <div className="item" key={name}>
                <span>{name}</span>
                <span>{step}</span>
              </div>
            ))}
            <button className="btn" onClick={() => setSheet(false)}>
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
