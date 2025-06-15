# Delivery Tracking API Dokumentation

## Basis-URL
```
http://localhost:3000
```

## Endpunkte

### 1. Lieferung erstellen
```http
POST /deliveries
```

**Request Body:**
```json
{
  "sender": {
    "name": "Max Mustermann",
    "address": "Musterstraße 1, 12345 Berlin",
    "phone": "+49123456789",
    "email": "max@example.com"
  },
  "recipient": {
    "name": "Anna Schmidt",
    "address": "Beispielweg 2, 54321 Hamburg",
    "phone": "+49987654321",
    "email": "anna@example.com"
  },
  "package": {
    "weight": 2.5,
    "dimensions": {
      "length": 30,
      "width": 20,
      "height": 15
    },
    "description": "Elektronik"
  },
  "estimatedDeliveryTime": "2024-03-20T15:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "trackingNumber": "DEL123456789",
  "status": "sent",
  "sender": { ... },
  "recipient": { ... },
  "package": { ... },
  "trackingHistory": [
    {
      "status": "sent",
      "timestamp": "2024-03-19T10:00:00Z",
      "description": "Lieferung wurde erstellt"
    }
  ]
}
```

### 2. Alle Lieferungen abrufen
```http
GET /deliveries
```

**Response (200 OK):**
```json
[
  {
    "trackingNumber": "DEL123456789",
    "status": "sent",
    ...
  },
  ...
]
```

### 3. Einzelne Lieferung abrufen
```http
GET /deliveries/:trackingNumber
```

**Response (200 OK):**
```json
{
  "trackingNumber": "DEL123456789",
  "status": "sent",
  ...
}
```

### 4. Lieferungsstatus aktualisieren
```http
PATCH /deliveries/:trackingNumber/status
```

**Request Body:**
```json
{
  "status": "picked_up",
  "location": {
    "type": "Point",
    "coordinates": [13.404954, 52.520008]
  },
  "description": "Paket wurde abgeholt"
}
```

**Response (200 OK):**
```json
{
  "trackingNumber": "DEL123456789",
  "status": "picked_up",
  "trackingHistory": [
    ...
  ]
}
```

### 5. Lieferung stornieren
```http
POST /deliveries/:trackingNumber/cancel
```

**Request Body:**
```json
{
  "reason": "Kunde hat storniert"
}
```

**Response (200 OK):**
```json
{
  "trackingNumber": "DEL123456789",
  "status": "cancelled",
  "trackingHistory": [
    ...
  ]
}
```

### 6. Lieferung zurücksenden
```http
POST /deliveries/:trackingNumber/return
```

**Request Body:**
```json
{
  "reason": "Empfänger nicht angetroffen"
}
```

**Response (200 OK):**
```json
{
  "trackingNumber": "DEL123456789",
  "status": "returned",
  "trackingHistory": [
    ...
  ]
}
```

## WebSocket Events

### Verbindung herstellen
```javascript
const socket = io('http://localhost:3000');
```

### Für Lieferungs-Updates anmelden
```javascript
socket.emit('subscribe', 'DEL123456789');
```

### Von Lieferungs-Updates abmelden
```javascript
socket.emit('unsubscribe', 'DEL123456789');
```

### Updates empfangen
```javascript
socket.on('deliveryUpdate', (data) => {
  console.log('Update für Lieferung:', data.trackingNumber);
  console.log('Update Details:', data.update);
});
```

## Status-Codes

- 200: Erfolgreiche Anfrage
- 201: Ressource erfolgreich erstellt
- 400: Ungültige Anfrage
- 404: Ressource nicht gefunden
- 500: Server-Fehler

## Fehler-Responses

```json
{
  "message": "Fehlermeldung"
}
``` 