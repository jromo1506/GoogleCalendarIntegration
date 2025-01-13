const Mensajes = require('../models/Mensaje');
// Crear un nuevo mensaje
exports.addMensaje = async (req, res) => {
    try {
        const mensaje = new Mensaje(req.body);
        const mensajeGuardado = await mensaje.save();

        // No tiene sentido este chequeo, porque si `save()` falla, lanzará un error
        res.status(201).json(mensajeGuardado);
    } catch (error) {
        // Detectar errores de validación o duplicados
        if (error.name === 'ValidationError') {
            return res.status(400).json({ mensaje: 'Datos inválidos', error: error.message });
        } else if (error.code === 11000) {
            return res.status(400).json({ mensaje: 'El mensaje ya existe', error: error.message });
        }

        res.status(500).json({ mensaje: 'Error al añadir un mensaje', error: error.message });
    }
};

// Obtener todos los mensajes
exports.getMensajes = async (req, res) => {
    try {
        const mensajes = await Mensaje.find();

        if (!mensajes || mensajes.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron mensajes' });
        }

        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener mensajes', error: error.message });
    }
};

// Obtener un mensaje por ID
exports.getMensajeById = async (req, res) => {
    const { id } = req.params;

    try {
        const mensaje = await Mensaje.findById(id);

        if (!mensaje) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }

        res.status(200).json(mensaje);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el mensaje', error: error.message });
    }
};

// exports.getMensajeByTelefono = async(req,res)=>{
//     const telefono = req.params.telefono;
//     try{
//         const mensajes
//     }
// }

// Actualizar un mensaje por ID
exports.updateMensaje = async (req, res) => {
    const { id } = req.params;

    try {
        const mensajeActualizado = await Mensaje.findByIdAndUpdate(id, req.body, {
            new: true, // Devuelve el documento actualizado
            runValidators: true // Aplica validaciones del esquema
        });

        if (!mensajeActualizado) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }

        res.status(200).json(mensajeActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el mensaje', error: error.message });
    }
};

// Eliminar un mensaje por ID
exports.deleteMensaje = async (req, res) => {
    const { id } = req.params;

    try {
        const mensajeEliminado = await Mensaje.findByIdAndDelete(id);

        if (!mensajeEliminado) {
            return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
        }

        res.status(200).json({ mensaje: 'Mensaje eliminado correctamente', data: mensajeEliminado });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el mensaje', error: error.message });
    }
};