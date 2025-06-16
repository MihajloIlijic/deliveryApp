require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const authRoutes = require('./src/routes/authRoutes');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/delivery-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB verbunden');
}).catch((error) => {
    console.error('MongoDB Verbindungsfehler:', error);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/auth', authRoutes);
app.use('/deliveries', deliveryRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const clients = new Map();

wss.on('connection', (ws) => {
    console.log('Neue WebSocket Verbindung');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Empfangene Nachricht:', data);

            if (data.type === 'subscribe') {
                const trackingNumber = data.trackingNumber;
                if (!clients.has(trackingNumber)) {
                    clients.set(trackingNumber, new Set());
                }
                clients.get(trackingNumber).add(ws);
                console.log(`Client abonniert Lieferung: ${trackingNumber}`);

                ws.send(JSON.stringify({
                    type: 'subscriptionConfirmed',
                    trackingNumber
                }));
            } else if (data.type === 'unsubscribe') {
                const trackingNumber = data.trackingNumber;
                if (clients.has(trackingNumber)) {
                    clients.get(trackingNumber).delete(ws);
                    if (clients.get(trackingNumber).size === 0) {
                        clients.delete(trackingNumber);
                    }
                    console.log(`Client hat Abonnement beendet: ${trackingNumber}`);
                }
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten der Nachricht:', error);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket Verbindung geschlossen');
        clients.forEach((clients, trackingNumber) => {
            clients.delete(ws);
            if (clients.size === 0) {
                clients.delete(trackingNumber);
            }
        });
    });
});

const broadcastDeliveryUpdate = (trackingNumber, delivery) => {
    if (clients.has(trackingNumber)) {
        const message = JSON.stringify({
            type: 'deliveryUpdate',
            trackingNumber,
            delivery
        });
        clients.get(trackingNumber).forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
};

app.locals.broadcastDeliveryUpdate = broadcastDeliveryUpdate;

server.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
}); 