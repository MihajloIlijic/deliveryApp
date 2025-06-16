const Delivery = require('../models/Delivery');

function generateTrackingNumber() {
    return 'DEL' + Math.floor(100000000 + Math.random() * 900000000);
}

exports.createDelivery = async (req, res) => {
    try {
        const trackingNumber = generateTrackingNumber();
        const delivery = new Delivery({
            ...req.body,
            trackingNumber,
            trackingHistory: [{
                status: 'sent',
                location: 'Warehouse',
                description: 'Sendung wurde erstellt'
            }]
        });
        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.status(201).json(delivery);
    } catch (error) {
        res.status(400).json({ message: error.message });
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
            return res.status(404).json({ message: 'Sendung nicht gefunden' });
        }
        res.json(delivery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateDeliveryStatus = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });
        if (!delivery) {
            return res.status(404).json({ message: 'Sendung nicht gefunden' });
        }

        delivery.status = req.body.status;
        delivery.trackingHistory.push({
            status: req.body.status,
            location: req.body.location || 'Unbekannt',
            description: req.body.description || 'Status aktualisiert'
        });

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.cancelDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });
        if (!delivery) {
            return res.status(404).json({ message: 'Sendung nicht gefunden' });
        }

        delivery.status = 'cancelled';
        delivery.trackingHistory.push({
            status: 'cancelled',
            location: 'Unbekannt',
            description: 'Sendung wurde storniert'
        });

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.returnDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findOne({ trackingNumber: req.params.trackingNumber });
        if (!delivery) {
            return res.status(404).json({ message: 'Sendung nicht gefunden' });
        }

        delivery.status = 'returned';
        delivery.trackingHistory.push({
            status: 'returned',
            location: 'Unbekannt',
            description: 'Sendung wird zurückgesendet'
        });

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateDelivery = async (req, res) => {
    try {
        const delivery = await Delivery.findById(req.params.id);
        if (!delivery) {
            return res.status(404).json({ message: 'Sendung nicht gefunden' });
        }

        // Update only the fields that are provided
        if (req.body.sender) {
            delivery.sender = { ...delivery.sender, ...req.body.sender };
        }
        if (req.body.recipient) {
            delivery.recipient = { ...delivery.recipient, ...req.body.recipient };
        }
        if (req.body.package) {
            delivery.package = { ...delivery.package, ...req.body.package };
        }
        if (req.body.status) {
            delivery.status = req.body.status;
            delivery.trackingHistory.push({
                status: req.body.status,
                location: req.body.location || 'Unbekannt',
                description: req.body.description || 'Status aktualisiert'
            });
        }

        await delivery.save();
        req.app.locals.broadcastDeliveryUpdate(delivery.trackingNumber, delivery);
        res.json(delivery);
    } catch (error) {
        console.error('Update error:', error);
        res.status(400).json({ message: error.message });
    }
}; 