const Paciente = require('../models/Paciente');

// Dar de alta un paciente
exports.crearPaciente = async (req, res) => {
    try {
        const nuevoPaciente = new Paciente(req.body);
        const pacienteGuardado = await nuevoPaciente.save();
        res.status(201).json(pacienteGuardado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al dar de alta al paciente', error });
    }
};

// Obtener todos los pacientes
// Obtener todos los pacientes
exports.obtenerPacientes = async (req, res) => {
    try {
        console.error("Testing deploy");
        const pacientes = await Paciente.find();
        res.status(200).json(pacientes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los pacientes', error });
    }
};


// Obtener un paciente por id
exports.obtenerPacientePorId = async (req, res) => {
    try {
        const paciente = await Paciente.findById(req.params.id);
        if (!paciente) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        res.status(200).json(paciente);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el paciente', error });
    }
};

// Actualizar un paciente
exports.actualizarPaciente = async (req, res) => {
    try {
        const pacienteActualizado = await Paciente.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!pacienteActualizado) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        res.status(200).json(pacienteActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar al paciente', error });
    }
};

// Eliminar un paciente
exports.eliminarPaciente = async (req, res) => {
    try {
        const pacienteEliminado = await Paciente.findByIdAndDelete(req.params.id);
        if (!pacienteEliminado) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }
        res.status(200).json({ mensaje: 'Paciente eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar al paciente', error });
    }
};


exports.buscarPacientePorNumeroTelefonico = async (req, res) => {
    try {
        const numero = req.params.telefono;
        const paciente = await Paciente.findOne({ telefonoWhatsapp: numero });
        if (!paciente) {
            return res.status(404).json({ mensaje: "Paciente no encontrado" })
        }
        res.status(200).json(paciente);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ mensaje: "Error al encontrar pacientes", error: error.message })
    }
}

// Guardar alergias
exports.guardarAlergias = async (req, res) => {
    try {
        const { id } = req.params;
        const { alergias } = req.body;

        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            id,
            { alergias },
            { new: true }
        );

        if (!pacienteActualizado) return res.status(404).json({ message: 'Paciente no encontrado' });

        res.json(pacienteActualizado);
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar alergias', error });
    }
};

// Guardar medicamentos
exports.guardarMedicamentos = async (req, res) => {
    try {
        const { id } = req.params;
        const { medicamentos } = req.body;

        const pacienteActualizado = await Paciente.findByIdAndUpdate(
            id,
            { medicamentos },
            { new: true }
        );

        if (!pacienteActualizado) return res.status(404).json({ message: 'Paciente no encontrado' });

        res.json(pacienteActualizado);
    } catch (error) {
        res.status(500).json({ message: 'Error al guardar medicamentos', error });
    }
};
