const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');

exports.crearPaciente = async (req, res) => {
    try {
        const nuevoPaciente = new Paciente(req.body);
        const pacienteGuardado = await nuevoPaciente.save();

        // Buscar usuarios con rol 'Administrador' o 'Recepcionista'
        const usuarios = await Usuario.find({
            tipo: { $in: ['Administrador', 'Recepcionista'] }
        });

        // Agregar el nuevo paciente a su lista de idPacientes
        await Promise.all(usuarios.map(usuario => {
            if (!usuario.idPacientes.includes(pacienteGuardado._id)) {
                usuario.idPacientes.push(pacienteGuardado._id);
                return usuario.save();
            }
        }));

        res.status(201).json(pacienteGuardado);
    } catch (error) {
        console.error('Error al crear paciente:', error);
        res.status(500).json({ mensaje: 'Error al dar de alta al paciente', error });
    }
};


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

//obtener por lista negra
exports.obtenerPacientesEnListaNegra = async (req, res) => {
    try {
        const pacientesEnListaNegra = await Paciente.find({ enListaNegra: true });
        res.status(200).json(pacientesEnListaNegra);
    } catch (error) {
        console.error('Error al obtener pacientes en lista negra:', error);
        res.status(500).json({ mensaje: 'Error al obtener los pacientes en lista negra.' });
    }
};

exports.verificarPacienteEnListaNegra = async (req, res) => {
    const { id } = req.params;

    try {
        const paciente = await Paciente.findById(id);

        if (!paciente) {
            return res.status(404).json({ mensaje: 'Paciente no encontrado' });
        }

        const estaEnListaNegra = paciente.enListaNegra === true;

        res.status(200).json({ enListaNegra: estaEnListaNegra });
    } catch (error) {
        console.error('Error al verificar lista negra:', error);
        res.status(500).json({ mensaje: 'Error al verificar el estado en lista negra' });
    }
};

exports.actualizarPaciente2 = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;

    // Limpieza: elimina campos null o undefined del body
    const camposValidos = {};
    for (const key in datosActualizados) {
      if (datosActualizados[key] !== null && datosActualizados[key] !== undefined) {
        camposValidos[key] = datosActualizados[key];
      }
    }

    const pacienteActualizado = await Paciente.findByIdAndUpdate(id, camposValidos, { new: true });

    if (!pacienteActualizado) {
      return res.status(404).json({ mensaje: 'Paciente no encontrado' });
    }

    res.json(pacienteActualizado);
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ mensaje: 'Error del servidor' });
  }
};