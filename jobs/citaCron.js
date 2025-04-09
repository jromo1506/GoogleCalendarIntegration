const PacienteCita = require('../models/PacienteCita');
const Paciente = require('../models/Paciente');
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
                // Verificar que exista información del paciente
                if (!cita.pacienteId) {
                    console.log(`Cita ${cita._id} no tiene paciente asociado`);
                    continue;
                }

                const paciente = cita.pacienteId;

                // Formatear nombre completo
                const nombreCompleto = `${paciente.nombre} ${paciente.apeP} ${paciente.apeM}`;
                const telefono = paciente.telefonoPaciente;

                // Obtener fecha y hora de la cita (asumiendo que la primera cita en el array es la relevante)
                const fechaCita = cita.idsCitas && cita.idsCitas.length > 0 ?
                    new Date(cita.idsCitas[0].split('|')[1]) : null;

                if (!fechaCita) {
                    console.log(`No se pudo determinar la fecha de la cita para ${nombreCompleto}`);
                    continue;
                }

                // Formatear hora en formato de 12 horas
                let horas = fechaCita.getUTCHours(); // Usa getUTCHours() en lugar de getHours()
                const minutos = fechaCita.getUTCMinutes().toString().padStart(2, '0');
                const ampm = horas >= 12 ? 'pm' : 'am';
                horas = horas % 12;
                horas = horas ? horas : 12; // Convertir 0 a 12
                const horaFormateada = `${horas}:${minutos}`;

                console.log(`Enviando recordatorio a ${nombreCompleto} (${telefono}) para la cita a las ${horaFormateada}${ampm}`);

                // Enviar el recordatorio
                const enviado = await enviarRecordatorio(telefono, nombreCompleto, horaFormateada, ampm);

                if (enviado) {
                    // Marcar como enviado en la base de datos
                    await PacienteCita.findByIdAndUpdate(cita._id, { enviado: true });
                    console.log(`Recordatorio enviado con éxito a ${nombreCompleto}`);
                } else {
                    console.log(`Error al enviar recordatorio a ${nombreCompleto}`);
                }

            } catch (error) {
                console.error(`Error al procesar cita ${cita._id}:`, error);
            }
        }

        console.log(`Proceso de recordatorios completado. ${citasPendientes.length} recordatorios procesados.`);
    } catch (error) {
        console.error('Error en el proceso de recordatorios:', error);
    }
};

module.exports = checkAppointmentsAndSendReminders;