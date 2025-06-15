const Delivery = require('../models/Delivery');

// Neue Lieferung erstellen
exports.createDelivery = async (req, res) => {
  try {
    const deliveryData = req.body;
    deliveryData.trackingNumber = await Delivery.generateTrackingNumber();
    
    const delivery = new Delivery(deliveryData);
    await delivery.save();

    // Füge ersten Tracking-Event hinzu
    await delivery.addTrackingEvent(
      'sent',
      delivery.currentLocation,
      'Lieferung wurde erstellt'
    );

    res.status(201).json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Alle Lieferungen abrufen
exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Einzelne Lieferung anhand der Tracking-Nummer abrufen
exports.getDeliveryByTrackingNumber = async (req, res) => {
  try {
    const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });
    if (!delivery) {
      return res.status(404).json({ message: 'Lieferung nicht gefunden' });
    }
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lieferungsstatus aktualisieren
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, location, description } = req.body;

    const delivery = await Delivery.findOne({ trackingNumber });
    if (!delivery) {
      return res.status(404).json({ message: 'Lieferung nicht gefunden' });
    }

    await delivery.addTrackingEvent(status, location, description);

    // Wenn die Lieferung als geliefert markiert wird, setze actualDeliveryTime
    if (status === 'delivered') {
      delivery.actualDeliveryTime = new Date();
    }

    await delivery.save();
    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lieferung stornieren
exports.cancelDelivery = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { reason } = req.body;

    const delivery = await Delivery.findOne({ trackingNumber });
    if (!delivery) {
      return res.status(404).json({ message: 'Lieferung nicht gefunden' });
    }

    if (delivery.status === 'delivered') {
      return res.status(400).json({ message: 'Gelieferte Sendungen können nicht storniert werden' });
    }

    await delivery.addTrackingEvent(
      'cancelled',
      delivery.currentLocation,
      `Lieferung storniert: ${reason}`
    );

    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lieferung zurücksenden
exports.returnDelivery = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { reason } = req.body;

    const delivery = await Delivery.findOne({ trackingNumber });
    if (!delivery) {
      return res.status(404).json({ message: 'Lieferung nicht gefunden' });
    }

    if (delivery.status !== 'delivered') {
      return res.status(400).json({ message: 'Nur gelieferte Sendungen können zurückgesendet werden' });
    }

    await delivery.addTrackingEvent(
      'returned',
      delivery.currentLocation,
      `Lieferung zurückgesendet: ${reason}`
    );

    res.json(delivery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 