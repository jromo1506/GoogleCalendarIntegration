const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Pago = require('../models/Pago'); // Ajusta el path si está en otra carpeta

// Función para enviar mensajes por WhatsApp
async function enviarMensajeWhatsApp(numeroTel, mensaje) {
   const numeroConCodigo = `52${numeroTel}`; // Cambia si usas otro país
   const data = {
      messaging_product: "whatsapp",
      to: numeroConCodigo,
      type: "text",
      text: { body: mensaje }
   };

   try {
      const response = await axios.post(
         'https://graph.facebook.com/v19.0/YOUR_PHONE_NUMBER_ID/messages', // Reemplaza con tu número de teléfono ID
         data,
         {
            headers: {
               Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, // Asegúrate de tenerlo en .env
               'Content-Type': 'application/json'
            }
         }
      );
      console.log('📤 Mensaje enviado a WhatsApp:', numeroConCodigo);
   } catch (err) {
      console.error('❌ Error enviando mensaje WhatsApp:', err.response?.data || err.message);
   }
}

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
   const sig = req.headers['stripe-signature'];
   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

   let event;
   try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
   } catch (err) {
      console.error('❌ Error verificando firma del webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
   }

   const transactionId = uuidv4();
   console.log('📦 Webhook recibido:', event.type, { transactionId });

   try {
      switch (event.type) {
         case 'checkout.session.completed': {
            const session = event.data.object;
            const sessionId = session.id;

            console.log('✅ Checkout completado, sessionId:', sessionId);

            const pago = await Pago.findOne({ stripeSessionId: sessionId });

            if (!pago) {
               console.warn('⚠️ Pago no encontrado con ese stripeSessionId', { sessionId, transactionId });
               return res.status(404).json({ error: 'Pago sin sesión asociada', transactionId });
            }

            if (pago.estado === 'completado') {
               console.log('ℹ️ El pago ya estaba marcado como completado');
               return res.status(200).send('Pago ya actualizado');
            }

            pago.estado = 'completado';
            pago.fechaPago = new Date();
            await pago.save();

            await enviarMensajeWhatsApp(pago.pacienteTel, '🎉 ¡Hemos confirmado tu pago exitosamente! Gracias por completar tu cita.');

            console.log('✅ Pago actualizado exitosamente en base de datos', {
               pagoId: pago._id,
               transactionId
            });

            return res.status(200).send('Evento procesado');
         }

         default:
            console.log('📎 Evento no manejado:', event.type);
            return res.status(200).send('Evento ignorado');
      }
   } catch (err) {
      console.error('🔥 Error procesando webhook:', {
         transactionId,
         error: err.message,
         stack: err.stack
      });
      return res.status(500).send('Error interno');
   }
});

module.exports = router;
