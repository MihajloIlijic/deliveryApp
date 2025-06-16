const Delivery = require('../models/Delivery');

function generateTrackingNumber() {
    const prefix = 'DEL';
    const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${prefix}${random}`;
}

exports.createDelivery = async (req, res) => {
    try {
        const deliveryData = req.body;
        deliveryData.trackingNumber = generateTrackingNumber();
        deliveryData.trackingHistory = [{
            status: 'sent',
            timestamp: new Date()
        }];

        const delivery = new Delivery(deliveryData);
        await delivery.save();

        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.status(201).json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Erstellen der Lieferung', error: error.message });
    }
};

exports.getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await Delivery.find();
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });
        if (!delivery) {
            return res.status(404).json({ message: 'Lieferung nicht gefunden' });
        }
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Abrufen der Lieferung', error: error.message });
    }
};

exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });

        if (!delivery) {
            return res.status(404).json({ message: 'Lieferung nicht gefunden' });
        }

        delivery.status = status;
        delivery.trackingHistory.push({
            status,
            timestamp: new Date()
        });

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Aktualisieren des Status', error: error.message });
    }
};

exports.cancelDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });

        if (!delivery) {
            return res.status(404).json({ message: 'Lieferung nicht gefunden' });
        }

        delivery.status = 'cancelled';
        delivery.trackingHistory.push({
            status: 'cancelled',
            timestamp: new Date()
        });

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Stornieren der Lieferung', error: error.message });
    }
};

exports.returnDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });

        if (!delivery) {
            return res.status(404).json({ message: 'Lieferung nicht gefunden' });
        }

        delivery.status = 'returned';
        delivery.trackingHistory.push({
            status: 'returned',
            timestamp: new Date()
        });

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Zurücksenden der Lieferung', error: error.message });
    }
}; 