const Mensajes = require('../models/Mensaje');
const Paciente = require('../models/Paciente')
const Usuario = require('../models/Usuario'); // Asegúrate de que esta línea esté presente



// Crear un nuevo mensaje
exports.addMensaje = async (req, res) => {
    try {
        const mensaje = new Mensajes(req.body);
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
// Obtener todos los mensajes para un usuario específico
exports.getMensajes = async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId;  // Obtener el usuarioId desde la query

        // Obtener el usuario para obtener sus pacientes
        const usuario = await Usuario.findById(usuarioId); // Asegúrate de tener el modelo Usuario
        
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        const idPacientes = usuario.idPacientes; // Array de IDs de pacientes asociados al usuario

        // Filtrar los mensajes que correspondan a los pacientes de este usuario
        const mensajes = await Mensajes.find({ idPaciente: { $in: idPacientes } });

        // Manejo de casos cuando no se encuentran mensajes
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
    const {telefono,nombrePaciente,estado}=req.query;
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


// DEPRECADO: Solo se usara si ngx pagination no funciona
exports.getMensajesFiltrados = async (req, res) => {
    try {
        // Parámetros de consulta
        const {
            page = 1, // Número de página (por defecto 1)
            limit = 10, // Límite de resultados por página (por defecto 10)
            search = '', // Búsqueda (valor opcional)
            sortBy = 'createdAt', // Campo para ordenar (por defecto, fecha de creación)
            sortOrder = 'desc', // Orden (asc o desc, por defecto descendente)
            estado, // Filtro por estado (opcional)
        } = req.query;

        // Construir el filtro de búsqueda
        const filters = {};
        if (search) {
            filters.$or = [
                { telefono: { $regex: search, $options: 'i' } },// Búsqueda insensible a mayúsculas/minúsculas
                { nombrePaciente: { $regex: search, $options: 'i' } } 
            ];
        }

        if (estado) {
            filters.estado = estado; // Filtrar por estado si se proporciona
        }

        // Opciones de paginación
        const options = {
            skip: (page - 1) * limit, // Saltar los resultados de las páginas anteriores
            limit: parseInt(limit), // Limitar los resultados devueltos
            sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } // Ordenar resultados
        };

        // Realizar la consulta
        const mensajes = await Mensajes.find(filters, null, options);

        // Obtener el conteo total de documentos para las páginas
        const total = await Mensajes.countDocuments(filters);

        res.status(200).json({
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
            mensajes
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los mensajes', error: error.message });
    }
};
