require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const deliveryRoutes = require('./src/routes/deliveryRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/delivery-app')
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('MongoDB Verbindungsfehler:', err));

// API Routes
app.use('/api/deliveries', deliveryRoutes);

// WebSocket Verbindung
io.on('connection', (socket) => {
  console.log('Neuer Client verbunden');

  // Client kann sich für Updates einer bestimmten Lieferung anmelden
  socket.on('subscribe', (trackingNumber) => {
    socket.join(trackingNumber);
    console.log(`Client subscribed to delivery: ${trackingNumber}`);
  });

  // Client kann sich von Updates einer bestimmten Lieferung abmelden
  socket.on('unsubscribe', (trackingNumber) => {
    socket.leave(trackingNumber);
    console.log(`Client unsubscribed from delivery: ${trackingNumber}`);
  });

  socket.on('disconnect', () => {
    console.log('Client getrennt');
  });
});

// WebSocket Middleware für Lieferungs-Updates
const deliveryUpdateMiddleware = (req, res, next) => {
  const trackingNumber = req.params.trackingNumber;
  if (trackingNumber) {
    io.to(trackingNumber).emit('deliveryUpdate', {
      trackingNumber,
      update: req.body
    });
  }
  next();
};

// WebSocket Middleware zu den relevanten Routen hinzufügen
app.patch('/api/deliveries/:trackingNumber/status', deliveryUpdateMiddleware);
app.post('/api/deliveries/:trackingNumber/cancel', deliveryUpdateMiddleware);
app.post('/api/deliveries/:trackingNumber/return', deliveryUpdateMiddleware);

// Basis-Route
app.get('/', (req, res) => {
  res.json({ message: 'Delivery Tracking API' });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 