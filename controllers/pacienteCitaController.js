const PacienteCita = require('../models/PacienteCita');
const Paciente = require('../models/Paciente');


exports.vincularPacienteCita = async (req, res) => {
    const vinculo = req.body;
    console.log("Datos recibidos:", vinculo);

    try {
      

        // Crear la cita con los datos correctos
        const nuevaCita = new PacienteCita({
            pacienteId: vinculo.pacienteId,
            idsCitas: vinculo.idsCitas || [], // Asegura que sea un array (evita undefined)
            recordatorioCita:  vinculo.recordatorioCita, // Fecha con un día adicional
            enviado: vinculo.enviado || false,
            recordatorioCitaDiciembre:  vinculo.recordatorioCitaDiciembre, // Fecha sin un dia adicional
            enviadoCitaDiciembre: vinculo.enviadoCitaDiciembre || false

        });

        const citaGuardada = await nuevaCita.save();
        res.status(200).json({ message: "Cita guardada exitosamente", citaGuardada });
    } catch (error) {
        console.error("Error al guardar la cita:", error);
        res.status(500).json({ message: "Error al guardar la cita", error: error.message });
    }
};




exports.subirVariasCitas = async(req,res)=>{
    try {
        const pacientesCitasArray = req.body;  // Se espera que los datos vengan en el cuerpo de la solicitud
        
        // Validar que se haya recibido un array de objetos con la estructura correcta
        if (!Array.isArray(pacientesCitasArray) || pacientesCitasArray.length === 0) {
          return res.status(400).json({ message: 'El cuerpo de la solicitud debe ser un array de registros.' });
        }
    
        // Usamos el método insertMany para insertar varios registros a la vez
        const result = await PacienteCita.insertMany(pacientesCitasArray);
        
        res.status(201).json({
          message: `Se han agregado ${result.length} registros con éxito.`,
          data: result
        });
    } 
    catch (error) {
        console.error('Error al agregar los registros:', error);
        res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
    }
}

// Obtener todas las citas con recordatorios pendientes
exports.obtenerCitasConRecordatorios = async (req, res) => {
    try {
        const now = new Date();
        const margen = 5 * 60 * 1000; // 5 minutos de margen
        
        const citas = await PacienteCita.find({
            recordatorioCita: {
                $lte: new Date(now.getTime() + margen),
                $gte: new Date(now.getTime() - margen)
            },
            enviado: { $ne: true } // Solo citas no enviadas
        }).populate('pacienteId');
        
        res.status(200).json(citas);
    } catch (error) {
        console.error('Error al obtener citas con recordatorios:', error);
        res.status(500).json({ mensaje: 'Error al obtener citas con recordatorios', error });
    }
};

// Obtener todas las citas (para propósitos de depuración)
exports.obtenerTodasLasCitas = async (req, res) => {
    try {
        const citas = await PacienteCita.find().populate('pacienteId');
        res.status(200).json(citas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las citas', error });
    }
};

// Reiniciar estado de enviado (para propósitos de prueba)
exports.reiniciarRecordatorios = async (req, res) => {
    try {
        await PacienteCita.updateMany({}, { $set: { enviado: false } });
        res.status(200).json({ mensaje: 'Estados de recordatorios reiniciados' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al reiniciar recordatorios', error });
    }
};