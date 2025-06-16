const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const auth = require('../middleware/auth');

// Alle Lieferungen abrufen
router.get('/', deliveryController.getAllDeliveries);

// Neue Lieferung erstellen
router.post('/', auth, deliveryController.createDelivery);

// Einzelne Lieferung abrufen
router.get('/:trackingNumber', auth, deliveryController.getDelivery);

// Lieferungsstatus aktualisieren
router.put('/:trackingNumber/status', auth, deliveryController.updateDeliveryStatus);

// Lieferung stornieren
router.put('/:trackingNumber/cancel', auth, deliveryController.cancelDelivery);

// Lieferung zurücksenden
router.put('/:trackingNumber/return', auth, deliveryController.returnDelivery);

module.exports = router; 