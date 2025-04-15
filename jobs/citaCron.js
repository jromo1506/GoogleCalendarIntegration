const PacienteCita = require('../models/PacienteCita');
const { enviarRecordatorio } = require('../services/plantillasService');

const checkAppointmentsAndSendReminders = async () => {
    try {
        // 1. Obtener la fecha y hora actual con margen
        const now = new Date();
        const margen = 5 * 60 * 1000; // 5 minutos de margen

        // 2. Buscar citas cuyo recordatorio debe enviarse ahora y que no hayan sido enviadas
        const citasPendientes = await PacienteCita.find({
            recordatorioCita: {
                $lte: new Date(now.getTime() + margen),
                $gte: new Date(now.getTime() - margen)
            },
            enviado: { $ne: true } // Solo citas no enviadas
        }).populate('pacienteId');

        console.log(`Encontradas ${citasPendientes.length} citas con recordatorios pendientes`);

        // 3. Procesar cada cita pendiente
        for (const cita of citasPendientes) {
            try {
                // Verificar paciente
                if (!cita.pacienteId) {
                    console.log(`Cita ${cita._id} no tiene paciente asociado`);
                    continue;
                }

                const paciente = cita.pacienteId;
                const nombreCompleto = `${paciente.nombre} ${paciente.apeP} ${paciente.apeM}`;
                const telefono = paciente.telefonoPaciente;

                // Obtener hora actual de México
                const horaMexico = new Date().toLocaleTimeString('es-MX', {
                    timeZone: 'America/Mexico_City',
                    hour12: true,
                    hour: 'numeric',
                    minute: '2-digit'
                });

                // Separar la hora y el indicador AM/PM
                const [horaMinutos, ampm] = horaMexico.split(' ');
                const [horas, minutos] = horaMinutos.split(':');

                console.log(`Enviando recordatorio a ${nombreCompleto}. Hora actual en México: ${horaMinutos} ${ampm}`);

                // Enviar recordatorio
                const enviado = await enviarRecordatorio(telefono, nombreCompleto, `${horas}:${minutos}`, ampm.toLowerCase());

                if (enviado) {
                    await PacienteCita.findByIdAndUpdate(cita._id, { enviado: true });
                    console.log(`Recordatorio enviado a ${nombreCompleto}`);
                }
            } catch (error) {
                console.error(`Error procesando cita ${cita._id}:`, error);
            }
        }

        console.log(`Proceso de recordatorios completado. ${citasPendientes.length} recordatorios procesados.`);
    } catch (error) {
        console.error('Error en el proceso de recordatorios:', error);
    }
};

module.exports = checkAppointmentsAndSendReminders;