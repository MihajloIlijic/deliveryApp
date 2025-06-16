const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Registrierung
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// Aktuellen Benutzer abrufen
router.get('/me', auth, authController.getCurrentUser);

module.exports = router; 