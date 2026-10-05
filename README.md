# Life Leveling System

Stand: Schritt 0 (App-Gerüst). Installierbare Web-App ohne Server; alle Daten liegen lokal im Browser-Speicher des Geräts.

## Inhalt dieses Stands

- App-Rahmen mit vier Reitern (Heute, Quests, Bereiche, Chronik) und Erfassen-Taste
- Lokale Datenbank (IndexedDB über Dexie), Schema Version 1: `character`, `kv`
- Sicherung: Export und Import als JSON-Datei, optional passwortverschlüsselt (PBKDF2-SHA-256, AES-256-GCM)
- Offline-Betrieb über Service Worker, Web-App-Manifest und Symbole für den Home-Bildschirm
- Systemstatus in den Einstellungen zur Prüfung der Voraussetzungen am Gerät

## Befehle

    npm install
    npm run dev       # Entwicklungsserver
    npm test          # automatisierte Tests der Sicherung
    npm run build     # Produktionsstand im Ordner docs/
    npm run preview   # Produktionsstand lokal ansehen

## Bereitstellung

Bereitstellung über GitHub Pages: Einstellung „Deploy from a branch“, Zweig `main`, Ordner `/docs`.

Der Ordner `docs/` enthält ausschließlich statische Dateien und läuft unter jeder HTTPS-Adresse, auch in einem Unterordner.
Installation und Offline-Betrieb setzen HTTPS voraus.

Installation auf dem iPhone: Adresse in Safari öffnen, Teilen, „Zum Home-Bildschirm“.

## Struktur

    src/data/      Datenbank, Sicherung, Verschlüsselung
    src/domain/    Regelwerk ohne UI-Abhängigkeit (ab Schritt 3)
    src/config/    Inhalte als Konfiguration (ab Schritt 3)
    src/screens/   Oberfläche
    tests/         automatisierte Tests
