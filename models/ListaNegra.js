const mongoose = require('mongoose');

const ListaNegraSchema = new mongoose.Schema({
   paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true
   },
   agregadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario',
      required: true
   },
   fechaAgregado: {
      type: Date,
      default: Date.now,
      required: true
   },
   razon: {
      type: String,
      required: true,
      maxlength: 200,
      trim: true
   },
   detalles: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: ''
   },
   tipo: {
      type: String,
      enum: ['temporal', 'permanente'],
      default: 'permanente',
      required: true
   },
   evidencia: {
      type: [String],
      default: [] 
   }
}, {
   timestamps: true 
});


module.exports = mongoose.model('ListaNegra', ListaNegraSchema);
