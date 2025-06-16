const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'picked_up', 'delivered', 'unknown', 'cancelled', 'returned'],
    default: 'pending'
  },
  sender: {
    name: String,
    address: String,
    contact: String
  },
  recipient: {
    name: String,
    address: String,
    contact: String
  },
  trackingHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: String,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Fügt createdAt und updatedAt Felder hinzu
});

// Index für Geospatial-Abfragen
deliverySchema.index({ currentLocation: '2dsphere' });

// Methode zum Hinzufügen eines Tracking-Events
deliverySchema.methods.addTrackingEvent = function(status, location, description) {
  if (!['pending', 'sent', 'picked_up', 'delivered', 'unknown', 'cancelled', 'returned'].includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  
  this.trackingHistory.push({
    status,
    location,
    description
  });
  this.status = status;
  return this.save();
};

// Statische Methode zum Generieren einer Tracking-Nummer
deliverySchema.statics.generateTrackingNumber = function() {
  const prefix = 'DEL';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
};

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery; 