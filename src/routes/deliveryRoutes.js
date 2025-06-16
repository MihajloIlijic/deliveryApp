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
router.patch('/:id', auth, deliveryController.updateDelivery);
router.patch('/:trackingNumber/status', auth, deliveryController.updateDeliveryStatus);

// Lieferung stornieren
router.post('/:trackingNumber/cancel', auth, deliveryController.cancelDelivery);

// Lieferung zurücksenden
router.post('/:trackingNumber/return', auth, deliveryController.returnDelivery);

module.exports = router; 