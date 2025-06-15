require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('websocket').server;
const cors = require('cors');
const mongoose = require('mongoose');
const deliveryRoutes = require('./src/routes/deliveryRoutes');

const app = express();
const server = http.createServer(app);

// WebSocket Server Setup
const wsServer = new WebSocket({
    httpServer: server,
    autoAcceptConnections: true  // Ändern auf true für automatische Akzeptanz
});

// Speichere aktive Verbindungen und ihre Subscriptions
const clients = new Map();

// WebSocket Verbindungshandler
wsServer.on('request', (request) => {
    const connection = request.accept(null, request.origin);
    const clientId = Date.now().toString();
    
    console.log(`Neue WebSocket Verbindung: ${clientId}`);
    clients.set(clientId, {
        connection,
        subscriptions: new Set()
    });

    // Nachrichten-Handler
    connection.on('message', (message) => {
        if (message.type === 'utf8') {
            try {
                const data = JSON.parse(message.utf8Data);
                console.log('Empfangene Nachricht von Client', clientId, ':', data);
                
                if (data.type === 'subscribe') {
                    const client = clients.get(clientId);
                    if (client) {
                        client.subscriptions.add(data.trackingNumber);
                        console.log(`Client ${clientId} subscribed to: ${data.trackingNumber}`);
                        // Bestätigung an den Client senden
                        connection.sendUTF(JSON.stringify({
                            type: 'subscriptionConfirmed',
                            trackingNumber: data.trackingNumber
                        }));
                    }
                } else if (data.type === 'unsubscribe') {
                    const client = clients.get(clientId);
                    if (client) {
                        client.subscriptions.delete(data.trackingNumber);
                        console.log(`Client ${clientId} unsubscribed from: ${data.trackingNumber}`);
                    }
                }
            } catch (error) {
                console.error('Fehler beim Verarbeiten der WebSocket Nachricht:', error);
            }
        }
    });

    // Verbindungsabbruch-Handler
    connection.on('close', () => {
        console.log(`WebSocket Verbindung geschlossen: ${clientId}`);
        clients.delete(clientId);
    });

    // Fehler-Handler
    connection.on('error', (error) => {
        console.error(`WebSocket Fehler für Client ${clientId}:`, error);
        clients.delete(clientId);
    });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('frontend')); // Statische Dateien aus dem frontend Ordner

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-app')
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// API Routes
app.use('/deliveries', deliveryRoutes);

// WebSocket Middleware für Lieferungs-Updates
const deliveryUpdateMiddleware = (req, res, next) => {
    const trackingNumber = req.params.trackingNumber;
    if (trackingNumber) {
        console.log('Sende Update für Lieferung:', trackingNumber);
        console.log('Aktive Clients:', clients.size);
        
        let updateSent = false;
        // Sende Update an alle abonnierten Clients
        clients.forEach((client, clientId) => {
            console.log(`Prüfe Client ${clientId}:`);
            console.log('Subscriptions:', Array.from(client.subscriptions));
            
            if (client.subscriptions.has(trackingNumber)) {
                console.log(`Sende Update an Client ${clientId}`);
                const updateMessage = JSON.stringify({
                    type: 'deliveryUpdate',
                    trackingNumber,
                    update: req.body
                });
                console.log('Update Nachricht:', updateMessage);
                
                try {
                    client.connection.sendUTF(updateMessage);
                    console.log('Update erfolgreich gesendet');
                    updateSent = true;
                } catch (error) {
                    console.error('Fehler beim Senden des Updates:', error);
                    // Entferne den Client bei Fehler
                    clients.delete(clientId);
                }
            }
        });
        
        if (!updateSent) {
            console.log('Keine Clients für Update gefunden');
        }
    }
    next();
};

// WebSocket Middleware zu den relevanten Routen hinzufügen
app.patch('/deliveries/:trackingNumber/status', deliveryUpdateMiddleware);
app.post('/deliveries/:trackingNumber/cancel', deliveryUpdateMiddleware);
app.post('/deliveries/:trackingNumber/return', deliveryUpdateMiddleware);

// Basis-Route
app.get('/', (req, res) => {
  res.json({ message: 'Delivery Tracking API' });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 