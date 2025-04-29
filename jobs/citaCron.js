const PacienteCita = require('../models/PacienteCita');
const { enviarRecordatorio } = require('../services/plantillasService');

const checkAppointmentsAndSendReminders = async () => {
    try {
        // 1. Obtener la fecha actual (sin hora)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Establecer a medianoche para comparar solo días
        
        // 2. Buscar citas cuyo recordatorio sea hoy y no hayan sido enviadas
        const citasPendientes = await PacienteCita.find({
            $expr: {
                $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$recordatorioCita" } },
                    { $dateToString: { format: "%Y-%m-%d", date: hoy } }
                ]
            },
            enviado: { $ne: true }
        }).populate('pacienteId');

        console.log(`Encontradas ${citasPendientes.length} citas con recordatorios para hoy`);

        // 3. Procesar cada cita pendiente
        for (const cita of citasPendientes) {
            try {
                if (!cita.pacienteId) {
                    console.log(`Cita ${cita._id} no tiene paciente asociado`);
                    continue;
                }

                const paciente = cita.pacienteId;
                const nombreCompleto = `${paciente.nombre} ${paciente.apeP} ${paciente.apeM}`;
                const telefono = paciente.telefonoPaciente;

                console.log(`Enviando recordatorio a ${nombreCompleto} para cita del ${cita.fechaCita}`);

                // Enviar recordatorio con todos los datos necesarios
                const enviado = await enviarRecordatorio(
                    telefono, 
                    nombreCompleto, 
                    cita.fechaCita, 
                    cita.horaCita, 
                    cita.ampm
                );

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