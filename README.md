# Delivery Tracking App

Eine einfache Webanwendung zur Sendungsverfolgung mit Echtzeit-Updates.

## Features

- Benutzerauthentifizierung (Registrierung/Login)
- Sendungsverfolgung mit Tracking-Nummer
- Echtzeit-Status-Updates via WebSocket
- REST API für Sendungsverwaltung
- Responsive Benutzeroberfläche

## Technologien

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Datenbank: MongoDB
- Echtzeit-Kommunikation: WebSocket
- Authentifizierung: JWT

## Projektstruktur

```
deliveryApp/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── src/
│   ├── models/
│   │   ├── User.js
│   │   └── Delivery.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── deliveryController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── deliveryRoutes.js
│   └── middleware/
│       └── auth.js
├── server.js
├── package.json
└── README.md
```

## API Endpunkte

### Authentifizierung
- `POST /auth/register` - Benutzer registrieren
- `POST /auth/login` - Benutzer anmelden
- `GET /auth/me` - Aktuelle Benutzerinformationen abrufen

### Sendungen
- `POST /deliveries` - Neue Sendung erstellen
- `GET /deliveries/:trackingNumber` - Sendungsdetails abrufen
- `PATCH /deliveries/:trackingNumber/status` - Sendungsstatus aktualisieren
- `POST /deliveries/:trackingNumber/cancel` - Sendung stornieren
- `POST /deliveries/:trackingNumber/return` - Sendung zurücksenden

## Installation

1. Repository klonen
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
3. MongoDB starten
4. Server starten:
   ```bash
   npm start
   ```
5. Anwendung im Browser öffnen: `http://localhost:3000`

## Verwendung

1. Registrieren Sie sich oder melden Sie sich an
2. Erstellen Sie eine neue Sendung oder geben Sie eine Tracking-Nummer ein
3. Verfolgen Sie den Status Ihrer Sendung in Echtzeit
4. Aktualisieren Sie den Status oder stornieren Sie die Sendung bei Bedarf

## Entwicklung

- `npm start` - Server starten
- `npm run dev` - Server im Entwicklungsmodus starten (mit Nodemon)
