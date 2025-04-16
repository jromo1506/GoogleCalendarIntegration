const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');
const Pago = require('../models/Pago');
const Paciente = require('../models/Paciente');
const mongoose = require('mongoose');
const axios = require('axios');

const MONTO_FIJO = 75000; // $750 MXN en centavos

console.log('🔍 Configuración Stripe:', {
    key: process.env.STRIPE_SECRET_KEY?.substring(0, 8) + '...',
    mode: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'LIVE' : 'TEST',
    paymentFrontUrl: process.env.PAYMENT_FRONT_URL || 'No configurado'
});
const log = {
    info: (message, data) => console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || ''),
    success: (message, data) => console.log(`[✓] ${new Date().toISOString()} - ${message}`, data || ''),
    error: (message, error) => console.error(`[✗] ${new Date().toISOString()} - ${message}`, error),
    warning: (message, data) => console.warn(`[!] ${new Date().toISOString()} - ${message}`, data || '')
};

// Función para enviar mensaje por WhatsApp
async function enviarMensajeWhatsApp(numero, mensaje) {
    try {
        if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_KEY) {
            log.warning('Configuración de WhatsApp no disponible');
            return false;
        }

        const response = await axios.post(process.env.WHATSAPP_API_URL, {
            phone: numero,
            message: mensaje
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        log.success('Mensaje de WhatsApp enviado', { numero, status: response.status });
        return true;
    } catch (error) {
        log.error('Error al enviar mensaje por WhatsApp', { numero, error: error.message });
        return false;
    }
}

// Función para generar un pago
exports.crearRegistroPago = async (req, res) => {
    const transactionId = uuidv4(); // ID único para tracking
    try {
        const { pacienteId, pacienteTel } = req.body;

        log.info(`Iniciando creación de registro de pago`, { transactionId, pacienteId });

        // Validación robusta
        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            log.warning('ID de paciente inválido', { transactionId, pacienteId });
            return res.status(400).json({ error: 'ID de paciente inválido', transactionId });
        }

        if (!pacienteTel || !/^\d{10,15}$/.test(pacienteTel)) {
            log.warning('Teléfono inválido', { transactionId, pacienteTel });
            return res.status(400).json({ error: 'Teléfono inválido', transactionId });
        }

        // Verificar existencia del paciente
        const pacienteExiste = await Paciente.exists({ _id: pacienteId });
        if (!pacienteExiste) {
            log.warning('Paciente no encontrado', { transactionId, pacienteId });
            return res.status(404).json({ error: 'Paciente no encontrado', transactionId });
        }

        // Configurar fechas
        // Configurar fechas con lógica especial de expiración
        const ahora = new Date();
        let limitePago = new Date(ahora);
        limitePago.setHours(22, 0, 0, 0); // 10 PM de hoy

        // Si la hora actual es 9 PM (21:00) o más, se pasa a 10 PM del día siguiente
        if (ahora.getHours() >= 21) {
            limitePago.setDate(limitePago.getDate() + 1);
        }

        const recordatorioPago = new Date(limitePago);
        recordatorioPago.setHours(limitePago.getHours() - 5); // 5 horas antes

        // Verificar pago existente
        const pagoExistente = await Pago.findOne({
            pacienteId,
            estado: 'pendiente',
            limitePago: { $gt: ahora }
        });

        if (pagoExistente) {
            log.warning('Pago pendiente existente', { transactionId, pagoId: pagoExistente._id });
            return res.status(200).json({
                ...pagoExistente.toObject(),
                transactionId,
                esExistente: true
            });
        }

        // Crear nuevo registro con un ID único para el enlace
        const paymentLinkId = uuidv4();
        const nuevoPago = await Pago.create({
            pacienteId,
            pacienteTel,
            recordatorioPago,
            limitePago,
            monto: MONTO_FIJO,
            estado: 'pendiente',
            sessionId: uuidv4(),
            paymentLinkId
        });

        const paciente = await Paciente.findById(pacienteId);

        // 1. Crear producto en Stripe
        const producto = await stripe.products.create({
            name: `Consulta Dental - ${paciente.nombre || 'Paciente'}`,
            description: 'Consulta odontológica inicial',
            metadata: {
                pacienteId: pacienteId.toString(),
                pagoId: nuevoPago._id.toString()
            }
        });

        // 2. Crear precio
        const precio = await stripe.prices.create({
            product: producto.id,
            unit_amount: MONTO_FIJO,
            currency: 'mxn',
        });

        // 3. Crear Checkout Session con expiración
        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price: precio.id,
                quantity: 1,
            }],
            mode: 'payment',
            expires_at: Math.floor(limitePago.getTime() / 1000),
            //cambiar a 'payment' de
            success_url: 'https://example.com/success',
            cancel_url: 'https://example.com/cancel',
            metadata: {
                pacienteId: pacienteId.toString(),
                pagoId: nuevoPago._id.toString()
            }
        });

        // Actualizar el pago con los datos de la sesión
        nuevoPago.id = session._id;
        nuevoPago.urlPago = session.url;
        nuevoPago.stripeSessionId = session.id;
        nuevoPago.stripeProductId = producto.id;
        nuevoPago.stripePriceId = precio.id;
        await nuevoPago.save();

        log.success('Registro de pago creado con enlace de pago', {
            transactionId,
            pagoId: nuevoPago._id,
            urlPago: session.url
        });


        return res.status(201).json({
            ...nuevoPago.toObject(),
            transactionId
        });

    } catch (error) {
        log.error('Error al crear registro de pago', {
            transactionId,
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({
            error: 'Error interno al crear el registro de pago',
            transactionId
        });
    }
};



exports.verificarEstadoPago = async (req, res) => {
    const transactionId = uuidv4(); // seguimiento
    try {
        const { pagoId } = req.params;

        log.info('Verificando estado del pago', { transactionId, pagoId });

        const pago = await Pago.findById(pagoId);
        if (!pago) {
            log.warning('Pago no encontrado', { transactionId });
            return res.status(404).json({ error: 'Pago no encontrado', transactionId });
        }

        if (!pago.stripeSessionId) {
            log.warning('Pago sin sessionId de Stripe', { transactionId });
            return res.status(400).json({ error: 'Pago sin sesión asociada', transactionId });
        }

        const session = await stripe.checkout.sessions.retrieve(pago.stripeSessionId);

        let nuevoEstado = pago.estado; exports.crearRegistroPago = async (req, res) => {
            const transactionId = uuidv4(); // ID único para tracking
            try {
                const { pacienteId, pacienteTel } = req.body;

                log.info(`Iniciando creación de registro de pago`, { transactionId, pacienteId });

                // Validación robusta
                if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
                    log.warning('ID de paciente inválido', { transactionId, pacienteId });
                    return res.status(400).json({ error: 'ID de paciente inválido', transactionId });
                }

                if (!pacienteTel || !/^\d{10,15}$/.test(pacienteTel)) {
                    log.warning('Teléfono inválido', { transactionId, pacienteTel });
                    return res.status(400).json({ error: 'Teléfono inválido', transactionId });
                }

                const pacienteExiste = await Paciente.exists({ _id: pacienteId });
                if (!pacienteExiste) {
                    log.warning('Paciente no encontrado', { transactionId, pacienteId });
                    return res.status(404).json({ error: 'Paciente no encontrado', transactionId });
                }

                const ahora = new Date();
                const limitePago = new Date(ahora);
                limitePago.setHours(13, 30, 0, 0); // 1:30 PM hoy

                const recordatorioPago = new Date(limitePago);
                recordatorioPago.setHours(limitePago.getHours() - 5);

                const pagoExistente = await Pago.findOne({
                    pacienteId,
                    estado: 'pendiente',
                    limitePago: { $gt: ahora }
                });

                if (pagoExistente) {
                    log.warning('Pago pendiente existente', { transactionId, pagoId: pagoExistente._id });
                    return res.status(200).json({
                        ...pagoExistente.toObject(),
                        transactionId,
                        esExistente: true
                    });
                }

                const paciente = await Paciente.findById(pacienteId);

                const producto = await stripe.products.create({
                    name: `Consulta Dental - ${paciente.nombre || 'Paciente'}`,
                    description: 'Consulta odontológica inicial',
                    metadata: {
                        pacienteId: pacienteId.toString()
                    }
                });

                const precio = await stripe.prices.create({
                    product: producto.id,
                    unit_amount: MONTO_FIJO,
                    currency: 'mxn',
                });

                const session = await stripe.checkout.sessions.create({
                    line_items: [{ price: precio.id, quantity: 1 }],
                    mode: 'payment',
                    expires_at: Math.floor(limitePago.getTime() / 1000),
                    success_url: 'https://example.com/success',
                    cancel_url: 'https://example.com/cancel',
                    metadata: {
                        pacienteId: pacienteId.toString()
                    }
                });

                // Crear el pago después de tener todos los datos de Stripe
                const nuevoPago = await Pago.create({
                    pacienteId,
                    pacienteTel,
                    recordatorioPago,
                    limitePago,
                    monto: MONTO_FIJO,
                    estado: 'pendiente',
                    paymentLinkId: uuidv4(),
                    stripeSessionId: session.id,
                    stripeProductId: producto.id,
                    stripePriceId: precio.id,
                    urlPago: session.url
                });

                log.success('Registro de pago creado con enlace de pago', {
                    transactionId,
                    pagoId: nuevoPago._id,
                    urlPago: session.url
                });

                return res.status(201).json({
                    ...nuevoPago.toObject(),
                    transactionId
                });

            } catch (error) {
                log.error('Error al crear registro de pago', {
                    transactionId,
                    error: error.message,
                    stack: error.stack
                });
                return res.status(500).json({
                    error: 'Error interno al crear el registro de pago',
                    transactionId
                });
            }
        };


        if (session.payment_status === 'paid') {
            nuevoEstado = 'completado';
        } else if (session.expires_at && session.expires_at * 1000 < Date.now()) {
            nuevoEstado = 'expirado';
        }

        // Solo actualizar si cambió el estado
        if (nuevoEstado !== pago.estado) {
            pago.estado = nuevoEstado;
            await pago.save();
            log.success('Estado del pago actualizado', { transactionId, nuevoEstado });
        } else {
            log.info('El estado del pago no ha cambiado', { transactionId, estado: pago.estado });
        }

        return res.status(200).json({
            pagoId: pago._id,
            estado: pago.estado,
            transactionId
        });

    } catch (error) {
        log.error('Error al verificar estado del pago', {
            transactionId,
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: 'Error interno al verificar estado del pago', transactionId });
    }
};

exports.rastrearPagoPorId = async (req, res) => {
    const transactionId = uuidv4();
    const { pagoId } = req.params;

    try {
        log.info('🔍 Rastreo de pago por ID', { transactionId, pagoId });

        const pago = await Pago.findById(pagoId);
        if (!pago) {
            log.warning('Pago no encontrado', { transactionId, pagoId });
            return res.status(404).json({ error: 'Pago no encontrado', transactionId });
        }

        if (!pago.stripeSessionId) {
            log.warning('El pago no tiene sessionId de Stripe', { transactionId });
            return res.status(400).json({ error: 'El pago no tiene sessionId de Stripe', transactionId });
        }

        const session = await stripe.checkout.sessions.retrieve(pago.stripeSessionId);
        let estadoStripe = session.payment_status;
        let actualizado = false;

        if (estadoStripe === 'paid' && pago.estado !== 'completado') {
            pago.estado = 'completado';
            pago.validadorPago = true;
            pago.fechaPago = new Date();
            await pago.save();
            actualizado = true;

            // Enviar mensaje de confirmación
            const mensaje = `✅ ¡Gracias por tu pago! Hemos registrado tu pago de $${(pago.monto / 100).toFixed(2)} MXN.`;
            await enviarMensajeWhatsApp(pago.pacienteTel, mensaje);

            log.success('🎉 Pago confirmado y actualizado', { transactionId, pagoId });
        } else if (estadoStripe === 'unpaid' || session.expires_at * 1000 < Date.now()) {
            pago.estado = 'expirado';
            await pago.save();
            actualizado = true;

            log.warning('⏰ Pago expirado', { transactionId, pagoId });
        }

        return res.status(200).json({
            pagoId: pago._id,
            estado: pago.estado,
            actualizado,
            transactionId
        });

    } catch (error) {
        log.error('❌ Error al rastrear el estado del pago', {
            transactionId,
            error: error.message,
            stack: error.stack
        });
        return res.status(500).json({ error: 'Error interno al rastrear pago', transactionId });
    }
};



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
        log.error('Error en webhook:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        const session = event.data.object;

        switch (event.type) {
            case 'checkout.session.completed':
                // Buscar el pago por el paymentLinkId en los metadatos
                const paymentLinkId = session.metadata?.paymentLinkId;
                if (!paymentLinkId) {
                    log.error('PaymentLinkId no encontrado en los metadatos');
                    break;
                }

                const pago = await Pago.findOneAndUpdate(
                    { paymentLinkId },
                    {
                        estado: 'completado',
                        validadorPago: true,
                        fechaPago: new Date()
                    },
                    { new: true }
                );

                if (pago) {
                    // Enviar mensaje por WhatsApp
                    const mensaje = `¡Gracias por tu pago! Hemos recibido tu pago de $${(pago.monto / 100).toFixed(2)} MXN.`;
                    await enviarMensajeWhatsApp(pago.pacienteTel, mensaje);

                    log.success(`Pago completado: ${session.id}`, {
                        pacienteTel: pago.pacienteTel,
                        monto: pago.monto
                    });
                } else {
                    log.error('Pago no encontrado para el paymentLinkId', { paymentLinkId });
                }
                break;

            case 'checkout.session.expired':
                await Pago.findOneAndUpdate(
                    { stripePaymentLinkId: session.id },
                    { estado: 'expirado' }
                );
                log.warning(`Pago expirado: ${session.id}`);
                break;

            default:
                log.info(`Evento no manejado: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        log.error('Error procesando webhook:', error);
        return res.status(500).json({ error: 'Error interno' });
    }
};