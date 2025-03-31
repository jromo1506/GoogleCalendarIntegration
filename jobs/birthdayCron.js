const Paciente = require('../models/Paciente');
const enviarFelicitacion = require('../services/plantillasService');

const checkBirthdaysAndSendGreetings = async () => {
  try {
    // Obtener la fecha actual (solo día y mes)
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Los meses van de 0 a 11
    const currentDay = today.getDate();

    // Buscar pacientes cuyo cumpleaños es hoy
    const pacientes = await Paciente.find({
      $expr: {
        $and: [
          { $eq: [{ $month: "$fechaNac" }, currentMonth] },
          { $eq: [{ $dayOfMonth: "$fechaNac" }, currentDay] }
        ]
      }
    });

    // Enviar felicitación a cada paciente encontrado
    for (const paciente of pacientes) {
      const nombreCompleto = `${paciente.nombre} ${paciente.apeP} ${paciente.apeM}`;
      const telefono = paciente.telefonoPaciente;
      
      console.log(`Enviando felicitación a ${nombreCompleto} (${telefono})`);
      
      await enviarFelicitacion(telefono,nombreCompleto);
    }

    console.log(`Proceso de felicitaciones completado. ${pacientes.length} pacientes felicitados.`);
  } catch (error) {
    console.error('Error en el proceso de felicitaciones:', error);
  }
};

module.exports = checkBirthdaysAndSendGreetings;