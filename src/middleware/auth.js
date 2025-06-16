const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            throw new Error();
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Bitte authentifizieren Sie sich' });
    }
}; 