const express = require('express');
const router = express.Router();
const PagoController = require('../controllers/pagoController');

router.post('/stripe', express.raw({ type: 'application/json' }), PagoController.webhookStripe);

module.exports = router;