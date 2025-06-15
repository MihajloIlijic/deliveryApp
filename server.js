require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

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

// WebSocket Verbindung
io.on('connection', (socket) => {
  console.log('Neuer Client verbunden');

  socket.on('disconnect', () => {
    console.log('Client getrennt');
  });
});

// Basis-Route
app.get('/', (req, res) => {
  res.json({ message: 'Delivery Tracking API' });
});

// Server starten
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
}); 