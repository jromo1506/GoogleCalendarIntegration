const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');

// Crear registro de pago (inicial)
router.post('/', pagoController.crearRegistroPago);

// Obtener pagos pendientes de un paciente
router.get('/pendientes/:pacienteId', pagoController.obtenerPagoPendiente);

// Generar enlace de pago (Stripe)
router.post('/generar-enlace', pagoController.generarEnlacePago);

// Verificar estado de pago
router.get('/verificar/:sessionId', pagoController.verificarPago);

// Webhook para Stripe
router.post('/webhook', express.raw({type: 'application/json'}), pagoController.webhookStripe);

module.exports = router;