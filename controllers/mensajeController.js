const Mensajes = require('../models/Mensaje');
const Paciente = require('../models/Paciente')
const Usuario = require('../models/Usuario'); // Asegúrate de que esta línea esté presente
const Mensaje = require('../models/Mensaje');
const MensajeDoctor = require('../models/MensajeDoctor');
const enviarMensajeWhatsApp = require('../services/whatsappService');


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

exports.getMensajesPorUsuario = async (req, res) => {
    try {
        const { usuarioId } = req.params; // Obtén el ID del usuario desde los parámetros de la ruta

        // Busca los pacientes relacionados con el usuario
        const usuario = await Usuario.findById(usuarioId);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Filtrar mensajes por los IDs en el array `idPacientes`
        const mensajes = await Mensajes.find({
            pacienteId: { $in: usuario.idPacientes }
        });

        if (!mensajes || mensajes.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron mensajes para este usuario' });
        }

        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los mensajes', error: error.message });
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


exports.getMensajesFiltrados = async (req, res) => {
    try {
        // Parámetros de consulta
        const {
            search = '', // Búsqueda (valor opcional)
            sortBy = 'createdAt', // Campo para ordenar (por defecto, fecha de creación)
            sortOrder = 'desc', // Orden (asc o desc, por defecto descendente)
            estado // Filtro por estado (opcional)
        } = req.query;

        const { idPacientes } = req.body; // Array de IDs de pacientes recibido por POST

        // Construir el filtro de búsqueda
        const filters = {};
   
        if (idPacientes && idPacientes.length > 0) {
            filters.idPaciente = { $in: idPacientes }; // Filtrar por los IDs del array
            console.log('Filtro aplicado:', filters);
        }

        if (search) {
            filters.$or = [
                { telefono: { $regex: search, $options: 'i' } }, // Búsqueda insensible a mayúsculas/minúsculas
                { nombrePaciente: { $regex: search, $options: 'i' } }
            ];
        }

        if (estado) {
            filters.estado = estado; // Filtrar por estado si se proporciona
        }

        // Opciones de ordenación
        const options = {
            sort: { [sortBy]: sortOrder === 'asc' ? 1 : -1 } // Ordenar resultados
        };

        // Realizar la consulta
        const mensajes = await Mensajes.find(filters, null, options);

        res.status(200).json(mensajes);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los mensajes', error: error.message });
    }
};


exports.getMensajesByIdPaciente = async(req,res) => {
    try{
        const {idPaciente} = req.params;
        const mensajes = await Mensajes.find({idPaciente});
        if(mensajes.length === 0){
           return res.status(400).json([]);
        }
        res.status(200).json(mensajes);
    }
    catch(error){
        res.status(500).json({mensaje:"Error al obtener los chats del usuario",error})
    }
}

// Guardar un mensaje enviado por el doctor
exports.addMensajeDoctor = async (req, res) => {
    try {
        const { idDoctor, idPaciente, mensaje } = req.body;

        // Guardar el mensaje en la base de datos
        const nuevoMensaje = new MensajeDoctor({
            idDoctor,
            idPaciente,
            mensaje,
        });

        const mensajeGuardado = await nuevoMensaje.save();

        // Obtener el número de WhatsApp del paciente
        const paciente = await Paciente.findById(idPaciente);
        if (!paciente) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }

        const numeroPaciente = paciente.telefonoPaciente;

        // Enviar el mensaje a WhatsApp
        await enviarMensajeWhatsApp(numeroPaciente, mensaje);

        res.status(201).json(mensajeGuardado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al guardar el mensaje del doctor', error: error.message });
    }
};

  exports.getMensajesDoctor = async (req, res) => {
    try {
      const { idDoctor, idPaciente } = req.query;
      const mensajes = await MensajeDoctor.find({ idDoctor, idPaciente });
      res.status(200).json(mensajes);
    } catch (error) {
      res.status(500).json({ mensaje: 'Error al obtener los mensajes del doctor', error: error.message });
    }
  };