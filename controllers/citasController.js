const Citas = require('../models/Citas');

// Crear una nueva cita
exports.crearCita = async (req, res) => {
    try {
        const nuevaCita = new Citas(req.body);
        const citaGuardada = await nuevaCita.save();
        res.status(201).json(citaGuardada);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al crear la cita', error });
    }
};

// Obtener todas las citas
exports.obtenerCitas = async (req, res) => {
    try {
        const citas = await Citas.find();
        res.status(200).json(citas);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener las citas', error });
    }
};

// Obtener una cita por ID
exports.obtenerCitaPorId = async (req, res) => {
    try {
        const cita = await Citas.findById(req.params.id);
        if (!cita) {
            return res.status(404).json({ mensaje: 'Cita no encontrada' });
        }
        res.status(200).json(cita);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener la cita', error });
    }
};

// Actualizar una cita
exports.actualizarCita = async (req, res) => {
    try {
        const citaActualizada = await Citas.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!citaActualizada) {
            return res.status(404).json({ mensaje: 'Cita no encontrada' });
        }
        res.status(200).json(citaActualizada);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar la cita', error });
    }
};

// Eliminar una cita
exports.eliminarCita = async (req, res) => {
    try {
        const citaEliminada = await Citas.findByIdAndDelete(req.params.id);
        if (!citaEliminada) {
            return res.status(404).json({ mensaje: 'Cita no encontrada' });
        }
        res.status(200).json({ mensaje: 'Cita eliminada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar la cita', error });
    }
};
