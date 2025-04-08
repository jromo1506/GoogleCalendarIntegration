const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Pago = require('../models/Pago');
const Paciente = require('../models/Paciente');

exports.crearRegistroPago = async (req, res) => {
    try {
        const { pacienteId, pacienteTel, recordatorioPago, limitePago } = req.body;

        const nuevoPago = new Pago({
            pacienteId,
            pacienteTel,
            recordatorioPago: new Date(recordatorioPago),
            limitePago: new Date(limitePago),
            validadorPago: false
        });

        await nuevoPago.save();

        res.status(201).json(nuevoPago);
    } catch (error) {
        console.error('Error al crear registro de pago:', error);
        res.status(500).json({ error: 'Error al crear registro de pago' });
    }
};

exports.generarEnlacePago = async (req, res) => {
    try {
        const { pacienteId, monto, descripcion } = req.body;

        // Buscar el registro de pago existente
        const pagoExistente = await Pago.findOne({ pacienteId, validadorPago: false });

        if (!pagoExistente) {
            return res.status(404).json({ error: 'No se encontró registro de pago para este paciente' });
        }

        // Configurar tiempo de expiración (usando el limitePago existente)
        const expiracion = Math.floor(pagoExistente.limitePago.getTime() / 1000);

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
            success_url: `${process.env.WEBHOOK_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.WEBHOOK_URL}/pago-cancelado`,
            expires_at: expiracion,
            metadata: {
                pacienteId: pacienteId.toString(),
                telefono: pagoExistente.pacienteTel
            }
        });

        // Actualizar registro de pago con info de Stripe
        pagoExistente.sessionId = session.id;
        pagoExistente.monto = monto;
        pagoExistente.urlPago = session.url;
        pagoExistente.estado = 'pendiente';
        await pagoExistente.save();

        res.status(200).json({
            urlPago: session.url,
            sessionId: session.id,
            expiracion: pagoExistente.limitePago,
            recordatorioPago: pagoExistente.recordatorioPago
        });

    } catch (error) {
        console.error('Error al generar enlace de pago:', error);
        res.status(500).json({ error: 'Error al generar enlace de pago' });
    }
};

exports.verificarPago = async (req, res) => {
    try {
        const { sessionId } = req.params;

        // Verificar en Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Buscar registro de pago
        const pago = await Pago.findOne({ sessionId });

        if (!pago) {
            return res.status(404).json({ error: 'Registro de pago no encontrado' });
        }

        if (session.payment_status === 'paid') {
            // Actualizar registro
            pago.validadorPago = true;
            pago.estado = 'completado';
            pago.fechaPago = new Date();
            await pago.save();

            return res.status(200).json({
                pagado: true,
                fechaPago: pago.fechaPago
            });
        }

        // Verificar si ha expirado
        if (session.expires_at && session.expires_at * 1000 < Date.now()) {
            pago.estado = 'expirado';
            await pago.save();
            return res.status(200).json({ expirado: true });
        }

        res.status(200).json({ pagado: false });
    } catch (error) {
        console.error('Error al verificar pago:', error);
        res.status(500).json({ error: 'Error al verificar estado del pago' });
    }
};

// Webhook para Stripe (similar al anterior)
exports.webhookStripe = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        await Pago.findOneAndUpdate(
            { sessionId: session.id },
            {
                validadorPago: true,
                estado: 'completado',
                fechaPago: new Date()
            }
        );

        console.log(`Pago completado para paciente: ${session.metadata.pacienteId}`);
    }

    res.status(200).json({ received: true });
};
// Método para obtener pagos pendientes
exports.obtenerPagoPendiente = async (req, res) => {
    try {
        const pago = await Pago.findOne({
            pacienteId: req.params.pacienteId,
            validadorPago: false,
            limitePago: { $gt: new Date() }
        });

        if (pago) {
            return res.status(200).json(pago);
        }
        res.status(404).json({ message: 'No hay pagos pendientes' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Método para obtener pagos completados
exports.webhookStripe = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verificar firma del webhook
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('⚠️ Error en el webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejar eventos específicos
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            console.log('💰 Pago recibido:', session.id);

            // Actualizar base de datos
            await Pago.findOneAndUpdate(
                { sessionId: session.id },
                {
                    validadorPago: true,
                    estado: 'completado',
                    fechaPago: new Date()
                }
            );
            break;

        case 'checkout.session.expired':
            const expiredSession = event.data.object;
            console.log('⌛ Pago expirado:', expiredSession.id);

            await Pago.findOneAndUpdate(
                { sessionId: expiredSession.id },
                { estado: 'expirado' }
            );
            break;

        default:
            console.log(`🔔 Evento no manejado: ${event.type}`);
    }

    res.status(200).json({ received: true });
};