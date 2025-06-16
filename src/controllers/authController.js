const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT Secret aus Umgebungsvariablen oder Standardwert
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Token generieren
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, {
        expiresIn: '24h'
    });
};

// Registrierung
exports.register = async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Prüfe ob Benutzer bereits existiert
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Benutzer existiert bereits' });
        }

        // Erstelle neuen Benutzer
        const user = new User({
            email,
            password,
            name
        });

        await user.save();

        // Generiere Token
        const token = generateToken(user._id);

        res.status(201).json({
            message: 'Benutzer erfolgreich registriert',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Fehler bei der Registrierung', error: error.message });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Finde Benutzer
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        // Prüfe Passwort
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten' });
        }

        // Generiere Token
        const token = generateToken(user._id);

        res.json({
            message: 'Login erfolgreich',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Login', error: error.message });
    }
};

// Aktuellen Benutzer abrufen
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Benutzer nicht gefunden' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Fehler beim Abrufen des Benutzers', error: error.message });
    }
}; 