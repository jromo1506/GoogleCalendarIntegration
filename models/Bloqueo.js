const mongoose = require('mongoose');

const bloqueoSchema = new mongoose.Schema({
   fechaInicio: {
      type: Date,
      required: true
   },
   fechaFin: {
      type: Date,
      required: true
   },
   motivo: {
      type: String,
   },
   creadoPorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
   },
   creadoPorNombre: {
      type: String,
      required: true
   }

}, {
   timestamps: true
});

module.exports = mongoose.model('Bloqueo', bloqueoSchema);