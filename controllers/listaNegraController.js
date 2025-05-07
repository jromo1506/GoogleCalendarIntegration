const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const ListaNegra = require('../models/listaNegra');

// Crear una nueva entrada en lista negra
exports.agregarAListaNegra = async (req, res) => {
   try {
      const { pacienteId, razon, detalles, tipo, evidencia, agregadoPor } = req.body;

      if (!agregadoPor) {
         return res.status(400).json({ error: 'ID del usuario que agrega es requerido' });
      }

      // Verificar si el paciente existe
      const pacienteExiste = await Paciente.findById(pacienteId);
      if (!pacienteExiste) {
         return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Verificar si ya está en lista negra
      const existeEntrada = await ListaNegra.findOne({ paciente: pacienteId });
      if (existeEntrada) {
         return res.status(400).json({ error: 'El paciente ya está en la lista negra' });
      }

      // ✅ ACTUALIZAR el campo enListaNegra a true
      await Paciente.findByIdAndUpdate(pacienteId, { enListaNegra: true });

      const nuevaEntrada = new ListaNegra({
         paciente: pacienteId,
         agregadoPor,
         razon,
         detalles,
         tipo,
         evidencia: evidencia || [],
         fecha: new Date()
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
         .populate('paciente', 'nombre apeP apeM telefonoWhatsapp correoElectronico telefonoPaciente',)
         .populate('agregadoPor', 'usuario tipo');

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
         return res.status(404).json({ error: 'Entrada no encontrada' });
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


// Verificar si un paciente está en lista negra
exports.verificarPacienteListaNegra = async (req, res) => {
   try {
      const { pacienteId } = req.params;
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

exports.buscarPorPacienteId = async (req, res) => {
   const { pacienteId } = req.params;
 
   try {
     const registro = await ListaNegra.findOne({ paciente: pacienteId })
       .populate('agregadoPor', 'usuario tipo'); 
 
     if (!registro) {
       return res.status(200).json({ enListaNegra: false });
     }
 
     res.status(200).json({
       enListaNegra: true,
       datos: registro
     });
   } catch (error) {
     console.error('Error al buscar en lista negra:', error);
     res.status(500).json({ mensaje: 'Error al consultar la lista negra' });
   }
}

exports.removerDeListaNegra = async (req, res) => {
   try {
     const { pacienteId } = req.params;
 
     // Elimina el registro en ListaNegra
     await ListaNegra.findOneAndDelete({ paciente: pacienteId });
 
     // Actualiza el campo enListaNegra en el paciente
     await Paciente.findByIdAndUpdate(pacienteId, { enListaNegra: false });
 
     res.status(200).json({ message: 'Paciente removido de la lista negra' });
   } catch (error) {
     console.error('Error al remover de lista negra:', error);
     res.status(500).json({ message: 'Error del servidor' });
   }
 };

exports.obtenerListaFiltrada = async (req, res) => {
   try {
      const { tipo, orden, search } = req.query;
      const query = {};

      if (tipo) {
         query.tipo = tipo;
      }

      const listaQuery = ListaNegra.find(query).populate('paciente', 'nombre apeP apeM telefonoWhatsapp correoElectronico telefonoPaciente');

      if (search) {
         const regex = new RegExp(search, 'i');
         listaQuery = listaQuery.populate({
            path: 'paciente',
            match: {
               $or: [
                  { nombre: regex },
                  { apeP: regex },
                  { apeM: regex },
                  { telefonoWhatsapp: regex },
                  { telefonoPaciente: regex }
               ]
            },
            select: 'nombre apeP apeM telefonoWhatsapp correoElectronico telefonoPaciente'
         });
      }
      
      if (orden === 'asc') {
         listaQuery = listaQuery.sort({ createdAt: 1 });
      } else if (orden === 'desc') {
         listaQuery = listaQuery.sort({ createdAt: -1 });
      }
      

      const data = await listaQuery.exec();
      const filteredData = data.filter(item => item.paciente !== null);

      res.json({ count: filteredData.length, data: filteredData });
   } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al obtener la lista negra' });
   }
};

