const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');

// Alle Lieferungen abrufen
router.get('/', deliveryController.getAllDeliveries);

// Neue Lieferung erstellen
router.post('/', deliveryController.createDelivery);

// Einzelne Lieferung abrufen
router.get('/:trackingNumber', deliveryController.getDeliveryByTrackingNumber);

// Lieferungsstatus aktualisieren
router.patch('/:trackingNumber/status', deliveryController.updateDeliveryStatus);

// Lieferung stornieren
router.post('/:trackingNumber/cancel', deliveryController.cancelDelivery);

// Lieferung zurücksenden
router.post('/:trackingNumber/return', deliveryController.returnDelivery);

module.exports = router; 