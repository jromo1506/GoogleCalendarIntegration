const Usuario = require('../models/Usuario')
const Paciente = require('../models/Paciente');
const ListaNegra = require('../models/listaNegra');

// Crear una nueva entrada en lista negra
exports.agregarAListaNegra = async (req, res) => {
   try {
      const { paciente, razon, detalles, tipo, evidencia } = req.body;
      const agregadoPor = req.user._id; // Asumiendo que usas autenticación
      
      // Verificar si el paciente existe
      const pacienteExiste = await Paciente.findById(paciente);
      if (!pacienteExiste) {
         return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Verificar si ya está en lista negra
      const existeEntrada = await ListaNegra.findOne({ paciente });
      if (existeEntrada) {
         return res.status(400).json({ error: 'El paciente ya está en la lista negra' });
      }

      const nuevaEntrada = new ListaNegra({
         paciente,
         agregadoPor,
         razon,
         detalles,
         tipo,
         evidencia: evidencia || []
      });

      await nuevaEntrada.save();

      res.status(201).json({
         message: 'Paciente agregado a lista negra exitosamente',
         data: nuevaEntrada
      });

   } catch (error) {
      res.status(500).json({
         error: 'Error al agregar a lista negra',
         details: error.message
      });
   }
};

// Obtener todas las entradas activas de lista negra
exports.obtenerListaNegra = async (req, res) => {
   try {
      const lista = await ListaNegra.find({})
         .populate('paciente', 'nombre apellido telefono')
         .populate('agregadoPor', 'nombre rol');

      res.status(200).json({
         count: lista.length,
         data: lista
      });
   } catch (error) {
      res.status(500).json({
         error: 'Error al obtener lista negra',
         details: error.message
      });
   }
};

// Obtener una entrada específica
exports.obtenerEntradaListaNegra = async (req, res) => {
   try {
      const entrada = await ListaNegra.findById(req.params.id)
         .populate('paciente')
         .populate('agregadoPor');

      if (!entrada) {
         return res.status(404).json({ error: 'Entrada no encontrada o inactiva' });
      }

      res.status(200).json(entrada);
   } catch (error) {
      res.status(500).json({
         error: 'Error al obtener entrada de lista negra',
         details: error.message
      });
   }
};

// Actualizar una entrada
exports.actualizarEntradaListaNegra = async (req, res) => {
   try {
      const { razon, detalles, tipo, evidencia } = req.body;

      const entradaActualizada = await ListaNegra.findByIdAndUpdate(
         req.params.id,
         {
            razon,
            detalles,
            tipo,
            evidencia,
            fechaActualizacion: Date.now()
         },
         { new: true, runValidators: true }
      ).populate('paciente').populate('agregadoPor');

      if (!entradaActualizada) {
         return res.status(404).json({ error: 'Entrada no encontrada' });
      }

      res.status(200).json({
         message: 'Entrada actualizada exitosamente',
         data: entradaActualizada
      });
   } catch (error) {
      res.status(500).json({
         error: 'Error al actualizar entrada',
         details: error.message
      });
   }
};

// Desactivar una entrada (eliminación lógica)
exports.eliminarEntradaListaNegra = async (req, res) => {
   try {
      const entradaEliminada = await ListaNegra.findByIdAndDelete(req.params.id);

      if (!entradaEliminada) {
         return res.status(404).json({ error: 'Entrada no encontrada' });
      }

      res.status(200).json({
         message: 'Entrada eliminada exitosamente',
         data: entradaEliminada
      });


      res.status(200).json({
         message: 'Entrada desactivada exitosamente',
         data: entradaDesactivada
      });
   } catch (error) {
      res.status(500).json({
         error: 'Error al desactivar entrada',
         details: error.message
      });
   }
};

// Verificar si un paciente está en lista negra
exports.verificarPacienteListaNegra = async (req, res) => {
   try {
      const entrada = await ListaNegra.findOne({ paciente: pacienteId });
      res.status(200).json({
         enListaNegra: !!entrada,
         data: entrada || null
      });
   } catch (error) {
      res.status(500).json({
         error: 'Error al verificar paciente',
         details: error.message
      });
   }
};