const Pago = require('../models/Pago'); 
const Paciente = require('../models/Paciente'); // Necesitarás el modelo de Paciente

const pagoController = {
    // Crear un nuevo registro de pago
    crearPago: async (req, res) => {
        try {
            const { pacienteId, pacienteTel, recordatorioPago, limitePago, validadorPago } = req.body;

            // Verificar si el paciente existe
            const pacienteExiste = await Paciente.findById(pacienteId);
            if (!pacienteExiste) {
                return res.status(404).json({ mensaje: 'Paciente no encontrado' });
            }

            // Crear el nuevo pago
            const nuevoPago = new Pago({
                pacienteId,
                pacienteTel,
                recordatorioPago: new Date(recordatorioPago),
                limitePago: new Date(limitePago),
                validadorPago: validadorPago || false
            });

            const pagoGuardado = await nuevoPago.save();

            res.status(201).json({
                mensaje: 'Registro de pago creado exitosamente',
                pago: pagoGuardado
            });
        } catch (error) {
            console.error('Error al crear registro de pago:', error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    },

    // Obtener todos los pagos de un paciente
    obtenerPagosPorPaciente: async (req, res) => {
        try {
            const { pacienteId } = req.params;

            const pagos = await Pago.find({ pacienteId })
                .populate('pacienteId', 'nombre apellidoPaterno apellidoMaterno')
                .sort({ limitePago: 1 });

            res.json(pagos);
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    },

    // Actualizar el estado de validación de un pago
    actualizarValidadorPago: async (req, res) => {
        try {
            const { pagoId } = req.params;
            const { validadorPago } = req.body;

            const pagoActualizado = await Pago.findByIdAndUpdate(
                pagoId,
                { validadorPago },
                { new: true }
            );

            if (!pagoActualizado) {
                return res.status(404).json({ mensaje: 'Pago no encontrado' });
            }

            res.json({
                mensaje: 'Estado de pago actualizado',
                pago: pagoActualizado
            });
        } catch (error) {
            console.error('Error al actualizar pago:', error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    },

    // Eliminar un registro de pago
    eliminarPago: async (req, res) => {
        try {
            const { pagoId } = req.params;

            const pagoEliminado = await Pago.findByIdAndDelete(pagoId);

            if (!pagoEliminado) {
                return res.status(404).json({ mensaje: 'Pago no encontrado' });
            }

            res.json({ mensaje: 'Pago eliminado exitosamente' });
        } catch (error) {
            console.error('Error al eliminar pago:', error);
            res.status(500).json({ mensaje: 'Error interno del servidor' });
        }
    },

    // Endpoint para verificar pagos pendientes (usado por un cron job o similar)
    verificarPagosPendientes: async () => {
        try {
            const ahora = new Date();
            const pagosPendientes = await Pago.find({
                limitePago: { $gt: ahora }, // Fechas mayores que ahora
                validadorPago: false
            }).populate('pacienteId', 'nombre telefonoWhatsapp');

            return pagosPendientes;
        } catch (error) {
            console.error('Error al verificar pagos pendientes:', error);
            throw error;
        }
    }
};

module.exports = pagoController;