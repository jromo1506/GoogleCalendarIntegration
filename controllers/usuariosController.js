const express = require('express');
const bcrypt = require('bcrypt');
const Usuario = require('../models/Usuario');
const Pacientes = require('../models/Paciente')


exports.crearUsuario = async (req, res) => {
    try {
        const usuarioExistente = await Usuario.findOne({ usuario: req.body.usuario });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const nuevoUsuario = new Usuario({
            usuario: req.body.usuario,
            password: hashedPassword,
            nombre: req.body.nombre,
            apeP: req.body.apeP,
            apeM: req.body.apeM,
            telefono: req.body.telefono,
            correo: req.body.correo,
            tipo: req.body.tipo,
            especialidad: req.body.especialidad,
        });
        

        const usuarioGuardado = await nuevoUsuario.save();
        //si se crea admin o recepcionista se le añaden los Id del paciente
        if(['Administrador', 'Recepcionista'].includes(usuarioGuardado.tipo)){
            const pacientes = await Pacientes.find({}, '_id');
            const idsPacientes = pacientes.map(p => p._id);
            usuarioGuardado.idPacientes = idsPacientes;
            await usuarioGuardado.save();
        }
        res.status(201).json(usuarioGuardado);
    } catch (error) {
        console.error('Error al crear el usuario:', error);
        res.status(500).json({ message: 'Error al crear el usuario', error });
    }
};

// Asignar pacientes a un doctor
exports.asignarPacientes = async (req, res) => {
    const { doctorId, pacienteIds } = req.body;
  
    try {
      const doctor = await Usuario.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor no encontrado' });
      }
  
      if (doctor.tipo !== 'Doctor') {
        return res.status(400).json({ message: 'El usuario no tiene el rol de doctor' });
      }
  
      if (!Array.isArray(pacienteIds)) {
        return res.status(400).json({ message: 'El formato de pacienteIds no es válido' });
      }
  
      // Verificar duplicados
      const pacientesDuplicados = pacienteIds.filter(pacienteId =>
        doctor.idPacientes.includes(pacienteId)
      );
  
      if (pacientesDuplicados.length > 0) {
        return res.status(400).json({
          message: 'Algunos pacientes ya están asignados a este doctor',
          pacientesDuplicados,
        });
      }
  
      // Agregar pacientes nuevos
      doctor.idPacientes.push(...pacienteIds.filter(pacienteId =>
        !doctor.idPacientes.includes(pacienteId)
      ));
  
      const doctorActualizado = await doctor.save();
  
      res.status(200).json({
        message: 'Pacientes asignados correctamente',
        doctor: {
          id: doctorActualizado._id,
          nombre: doctorActualizado.nombre,
          idPacientes: doctorActualizado.idPacientes,
        },
      });
    } catch (error) {
      console.error('Error al asignar pacientes:', error);
      res.status(500).json({ message: 'Error al asignar pacientes', error: error.message });
    }
  };
  
exports.autenticarUsuario = async (req, res) => {
    const { usuario, password } = req.body;

    try {
        // Busca el usuario en la base de datos
        const usuarioEncontrado = await Usuario.findOne({ usuario });
        if (!usuarioEncontrado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Comparar la contraseña ingresada con la contraseña almacenada (hash)
        const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        res.status(200).json({
            message: 'Autenticación exitosa',
            usuario: {
                id: usuarioEncontrado._id,
                usuario: usuarioEncontrado.usuario,
                tipo: usuarioEncontrado.tipo, // Incluye el tipo de usuario
                telefono: usuarioEncontrado.telefono,
            },
        });
    } catch (error) {
        console.error('Error al autenticar el usuario:', error);
        res.status(500).json({ message: 'Error al autenticar el usuario', error: error.message });
    }
};


// Obtener todos los usuarios
exports.obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los usuarios', error });
    }
};

// Obtener un usuario por ID
exports.obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener el usuario', error });
    }
};

// Actualizar un usuario
exports.actualizarUsuario = async (req, res) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!usuarioActualizado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json(usuarioActualizado);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el usuario', error });
    }
};

// Eliminar un usuario
exports.eliminarUsuario = async (req, res) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!usuarioEliminado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }
        res.status(200).json({ mensaje: 'Usuario eliminado' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el usuario', error });
    }
};




exports.getIdPacientes = async (req, res) => {
    try {
        const { usuarioId } = req.params; // Obtén el ID del usuario desde los parámetros de la URL

        // Busca al usuario por su ID y limita la selección a solo idPacientes
        const usuario = await Usuario.findById(usuarioId).select('idPacientes');

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        // Devuelve solo los ids como un array plano
        res.status(200).json({
            idPacientes: usuario.idPacientes,
        });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener los idPacientes', error: error.message });
    }
};