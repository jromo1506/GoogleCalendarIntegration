const PacienteCita = require('../models/PacienteCita');
exports.vincularPacienteCita = async (req, res) => {
    const vinculo = req.body;
    console.log("Datos recibidos:", vinculo);

    try {
        let fechaExpiracion = new Date(vinculo.expiraEn);
        fechaExpiracion.setDate(fechaExpiracion.getDate() + 1); // Aumenta un día

        // Crear la cita con los datos correctos
        const nuevaCita = new PacienteCita({
            pacienteId: vinculo.pacienteId,
            idsCitas: vinculo.idsCitas || [], // Asegura que sea un array (evita undefined)
            expiraEn: fechaExpiracion // Fecha con un día adicional
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
