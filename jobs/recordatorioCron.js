const Pago = require('../models/Pago');
const Paciente = require('../models/Paciente');

async function verificarPagosExpirados() {
    try {
        const ahora = new Date();
        const pagosExpirados = await Pago.find({
            validadorPago: false,
            limitePago: { $lt: ahora }
        }).populate('pacienteId');

        for (const pago of pagosExpirados) {
            console.log(`Pago expirado para el paciente ${pago.pacienteId.nombre}`);
            await enviarMensajeWhatsApp(pago.pacienteTel, 'Tu enlace de pago ha expirado');
        }
    } catch (error) {
        console.error('Error al verificar pagos expirados:', error);
    }
}

async function verificarRecordatorios() {
    try {
        const ahora = new Date();
        const recordatorios = await Pago.find({
            validadorPago: false,
            recordatorioPago: { $lt: ahora },
            limitePago: { $gt: ahora } 
        }).populate('pacienteId');

        for (const pago of recordatorios) {
            console.log(`Enviando recordatorio a ${pago.pacienteId.nombre}`);
            await enviarMensajeWhatsApp(pago.pacienteTel, 'Recordatorio: Tu pago vence hoy a las 9 PM');
        }
    } catch (error) {
        console.error('Error al verificar recordatorios:', error);
    }
}

module.exports = {
    verificarPagosExpirados,
    verificarRecordatorios
};