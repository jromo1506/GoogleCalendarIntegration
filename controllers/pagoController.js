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
        const ahora = new Date();
        const limitePago = new Date(ahora);
        limitePago.setDate(ahora.getDate() + 1);
        limitePago.setHours(21, 0, 0, 0); // 9 PM del día siguiente

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
            sessionId: uuidv4(), // Generamos un sessionId inicial
            paymentLinkId // ID único para el enlace de pago
        });

        // Generar el enlace de pago inmediatamente
        const paciente = await Paciente.findById(pacienteId);

        // 1. Crear producto en Stripe
        const producto = await stripe.products.create({
            name: `Consulta Dental - ${paciente.nombre || 'Paciente'}`,
            description: 'Consulta odontológica inicial',
            metadata: { pacienteId: pacienteId.toString() }
        });

        // 2. Crear precio
        const precio = await stripe.prices.create({
            product: producto.id,
            unit_amount: MONTO_FIJO,
            currency: 'mxn',
        });

        // 3. Crear Payment Link
        const paymentLink = await stripe.paymentLinks.create({
            line_items: [{
                price: precio.id,
                quantity: 1,
            }],
            metadata: {
                pacienteId: pacienteId.toString(),
                pagoId: nuevoPago._id.toString()
            }
        });

        // Actualizar el pago con la URL generada
        nuevoPago.urlPago = paymentLink.url;
        nuevoPago.stripePaymentLinkId = paymentLink.id;
        await nuevoPago.save();

        log.success('Registro de pago creado con enlace de pago', {
            transactionId,
            pagoId: nuevoPago._id,
            urlPago: paymentLink.url
        });

        return res.status(201).json({
            ...nuevoPago.toObject(),
            transactionId
        });

    } catch (error) {
        log.error('Error en crearRegistroPago', {
            transactionId,
            error: {
                message: error.message,
                type: error.type,
                code: error.code
            }
        });
        return res.status(500).json({
            error: 'Error al crear registro',
            transactionId,
            detalle: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
};

//obtencion de link
exports.obtenerDatosUsuarioYPago = async (req, res) => {
    const transactionId = uuidv4();
    try {
        const { pacienteId, pacienteTel } = req.body;

        log.info(`Obteniendo datos del usuario y pago`, { transactionId, pacienteId });

        // Validación
        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            log.warning('ID de paciente inválido', { transactionId, pacienteId });
            return res.status(400).json({ error: 'ID de paciente inválido', transactionId });
        }

        // Obtener datos del paciente
        const paciente = await Paciente.findById(pacienteId).lean();
        if (!paciente) {
            log.warning('Paciente no encontrado', { transactionId, pacienteId });
            return res.status(404).json({ error: 'Paciente no encontrado', transactionId });
        }

        // Obtener el pago más reciente
        const pago = await Pago.findOne({ pacienteId }).sort({ createdAt: -1 }).lean();

        const ahora = new Date();
        let recordatorioEnviado = false;
        let pagoExpirado = false;
        let pagoCompletado = false;

        if (pago) {
            // Verificar si el pago ya fue validado
            if (pago.validadorPago) {
                pagoCompletado = pago.estado === 'completado';
                pagoExpirado = pago.estado === 'expirado';
            } else {
                // Si no está validado, verificar el estado actual
                if (pago.limitePago < ahora) {
                    // Pago expirado
                    await Pago.updateOne({ _id: pago._id }, {
                        estado: 'expirado',
                        validadorPago: true
                    });
                    pagoExpirado = true;
                } else if (pago.urlPago && pago.stripePaymentLinkId) {
                    // Verificar con Stripe si el pago se completó
                    try {
                        const paymentLink = await stripe.paymentLinks.retrieve(pago.stripePaymentLinkId);
                        if (paymentLink.payment_status === 'paid') {
                            await Pago.updateOne({ _id: pago._id }, {
                                estado: 'completado',
                                validadorPago: true,
                                fechaPago: new Date()
                            });
                            pagoCompletado = true;
                        }
                    } catch (error) {
                        log.error('Error al verificar pago con Stripe', { error: error.message });
                    }
                }

                // Enviar recordatorio si es necesario
                if (!pago.recordatorioEnviado && pago.recordatorioPago <= ahora && pago.estado === 'pendiente') {
                    const mensaje = `⏰ Recordatorio: Tienes hasta ${pago.limitePago.toLocaleString()} para completar tu pago. ${pago.urlPago}`;
                    await enviarMensajeWhatsApp(pacienteTel, mensaje);
                    await Pago.updateOne({ _id: pago._id }, { recordatorioEnviado: true });
                    recordatorioEnviado = true;
                }
            }
        }

        // Preparar respuesta
        const responseData = {
            paciente: {
                nombre: paciente.nombre,
                apellidos: `${paciente.apeP} ${paciente.apeM}`.trim(),
                telefono: paciente.telefonoWhatsapp,
                correo: paciente.correoElectronico,
                fechaNacimiento: paciente.fechaNac,
                genero: paciente.genero
            },
            pago: pago ? {
                estado: pagoExpirado ? 'expirado' : (pagoCompletado ? 'completado' : pago.estado),
                monto: pago.monto / 100, // Convertir a pesos
                urlPago: pago.urlPago,
                fechaLimite: pago.limitePago,
                fechaRecordatorio: pago.recordatorioPago,
                recordatorioEnviado: pago.recordatorioEnviado || recordatorioEnviado
            } : null,
            alertas: {
                recordatorioEnviado,
                pagoExpirado,
                pagoCompletado
            },
            transactionId
        };

        log.success('Datos obtenidos correctamente', { transactionId });
        return res.status(200).json(responseData);

    } catch (error) {
        log.error('Error en obtenerDatosUsuarioYPago', {
            transactionId,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
        return res.status(500).json({
            error: 'Error al obtener datos del usuario y pago',
            transactionId,
            detalle: process.env.NODE_ENV === 'development' ? error.message : null
        });
    }
};

exports.verificarYActualizarPago = async (req, res) => {
    const transactionId = uuidv4();
    try {
        const { pacienteId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(pacienteId)) {
            return res.status(400).json({ error: 'ID de paciente inválido', transactionId });
        }

        // Buscar el pago más reciente
        const pago = await Pago.findOne({ pacienteId }).sort({ createdAt: -1 });
        if (!pago) {
            return res.status(404).json({ error: 'No se encontraron pagos', transactionId });
        }

        const ahora = new Date();
        let estadoActualizado = pago.estado;
        let flujo = 'espera';

        // Solo verificar si no ha sido validado antes
        if (!pago.validadorPago) {
            // Verificar si el pago expiró
            if (pago.limitePago < ahora) {
                estadoActualizado = 'expirado';
                flujo = 'pago_expirado';
            }
            // Verificar con Stripe si hay un pago completado
            else if (pago.stripePaymentLinkId) {
                try {
                    const paymentLink = await stripe.paymentLinks.retrieve(pago.stripePaymentLinkId);
                    if (paymentLink.payment_status === 'paid') {
                        estadoActualizado = 'completado';
                        flujo = 'pago_completado';
                    }
                } catch (error) {
                    log.error('Error al verificar pago con Stripe', error);
                }
            }

            // Actualizar en base de datos si cambió el estado
            if (estadoActualizado !== pago.estado) {
                await Pago.updateOne({ _id: pago._id }, {
                    estado: estadoActualizado,
                    validadorPago: true,
                    ...(estadoActualizado === 'completado' && { fechaPago: ahora })
                });
            }
        } else {
            // Si ya estaba validado, determinar el flujo basado en el estado
            flujo = pago.estado === 'completado' ? 'pago_completado' :
                pago.estado === 'expirado' ? 'pago_expirado' : 'pago_pendiente';
        }

        return res.status(200).json({
            estado: estadoActualizado,
            flujo,
            urlPago: pago.urlPago,
            transactionId
        });

    } catch (error) {
        log.error('Error en verificarYActualizarPago', {
            transactionId,
            error: {
                message: error.message,
                stack: error.stack
            }
        });
        return res.status(500).json({
            error: 'Error al verificar pago',
            transactionId,
            detalle: process.env.NODE_ENV === 'development' ? error.message : null
        });
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