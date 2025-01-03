const Doctor = require('../models/Doctores');

// Dar de alta un doctor
exports.crearDoctor = async (req, res) => {
    try {
        const nuevaDoctor = new Doctor(req.body);
        const doctorGuardado = await nuevaDoctor.save();
        res.status(201).json(doctorGuardado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al dar de alta el doctor', error });
    }
};

// Obtener todos los doctores
exports.obtenerDoctores = async (req, res) => {
    try {
        const doctor = await Doctor.find();
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los doctores', error });
    }
};

// Obtener un doctor por id
exports.obtenerDoctorPorId = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ mensaje: 'Doctor no encontrado' });
        }
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el doctor', error });
    }
};

// Actualizar un doctor
exports.actualizarDoctor = async (req, res) => {
    try {
        const doctorActualizado = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!doctorActualizado) {
            return res.status(404).json({ mensaje: 'Doctor no encontrado' });
        }
        res.status(200).json(doctorActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar al Doctor', error });
    }
};

// Eliminar un doctor
exports.eliminarDoctor = async (req, res) => {
    try {
        const doctorEliminado = await Doctor.findByIdAndDelete(req.params.id);
        if (!doctorEliminado) {
            return res.status(404).json({ mensaje: 'Doctor no encontrado' });
        }
        res.status(200).json({ mensaje: 'Doctor eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar al Doctor', error });
    }
};
