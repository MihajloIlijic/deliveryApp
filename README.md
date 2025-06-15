# Delivery Tracking App

Eine Node.js-basierte Anwendung für das Tracking von Lieferungen mit REST API und WebSocket-Unterstützung.

## Features

- REST API für Lieferungsverwaltung
- Echtzeit-Tracking über WebSockets
- MongoDB Datenbankanbindung
- CORS-Unterstützung für Frontend-Integration

## Installation

1. Klonen Sie das Repository
2. Installieren Sie die Abhängigkeiten:
   ```bash
   npm install
   ```
3. Erstellen Sie eine `.env` Datei im Root-Verzeichnis mit folgenden Variablen:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/delivery-app
   ```
4. Starten Sie den Server:
   ```bash
   npm start
   ```

## Projektstruktur

```
delivery-app/
├── src/
│   ├── config/         # Konfigurationsdateien
│   ├── controllers/    # Route Controller
│   ├── models/         # Datenbankmodelle
│   ├── routes/         # API Routen
│   ├── services/       # Geschäftslogik
│   └── websocket/      # WebSocket Handler
├── .env               # Umgebungsvariablen
└── server.js         # Hauptanwendungsdatei
```
