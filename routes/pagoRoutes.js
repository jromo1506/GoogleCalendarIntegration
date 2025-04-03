const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Pago = require('../models/Pago');
const Paciente = require('../models/Paciente');

// Generar sesión de pago en Stripe
router.post('/generar-pago', async (req, res) => {
    try {
        const { pacienteId, monto, descripcion, metadata } = req.body;

        // Verificar si el paciente existe
        const paciente = await Paciente.findById(pacienteId);
        if (!paciente) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }

        // Crear sesión de pago en Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: descripcion,
                    },
                    unit_amount: monto,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${process.env.DOMINIO_FRONTEND}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}&user_id=${usuarioId}`,
            cancel_url: `${process.env.DOMINIO_FRONTEND}/pago-cancelado?user_id=${usuarioId}`,
            metadata: {
                ...metadata,
                pacienteId: pacienteId.toString()
            }
        });

        // Guardar la sesión en la base de datos
        const nuevoPago = new Pago({
            pacienteId,
            pacienteTel: metadata.telefono,
            recordatorioPago: new Date(),
            limitePago: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas después
            validadorPago: false,
            stripeSessionId: session.id,
            monto: monto / 100 // Convertir de centavos a pesos
        });

        await nuevoPago.save();

        res.json({
            urlPago: session.url,
            sessionId: session.id
        });

    } catch (error) {
        console.error('Error al generar pago:', error);
        res.status(500).json({ error: 'Error al generar enlace de pago' });
    }
});

// Webhook para recibir confirmaciones de Stripe
router.post('/webhook-stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('⚠️ Error en webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar el evento de pago completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            // Actualizar el pago en la base de datos
            await Pago.findOneAndUpdate(
                { stripeSessionId: session.id },
                {
                    validadorPago: true,
                    fechaPago: new Date()
                }
            );

            // Aquí podrías enviar un mensaje al paciente vía WhatsApp
            // usando la API de WhatsApp con session.metadata.telefono
            console.log(`✅ Pago completado para paciente: ${session.metadata.pacienteId}`);

        } catch (error) {
            console.error('Error al actualizar pago:', error);
        }
    }
    // Verificar estado de pago
    router.get('/verificar-pago/:sessionId', async (req, res) => {
        try {
            const { sessionId } = req.params;
            const pago = await Pago.findOne({ stripeSessionId: sessionId });

            if (!pago) {
                return res.status(404).json({ error: 'Sesión de pago no encontrada' });
            }

            res.json({
                pagado: pago.validadorPago,
                monto: pago.monto,
                fechaPago: pago.fechaPago
            });
        } catch (error) {
            console.error('Error al verificar pago:', error);
            res.status(500).json({ error: 'Error al verificar estado de pago' });
        }
    });

    res.json({ received: true });
});

module.exports = router;