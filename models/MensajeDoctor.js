const mongoose = require('mongoose');

const MensajeDoctorSchema = new mongoose.Schema({
  idDoctor: {
    type: String,
    required: true,
  },
  idPaciente: {
    type: String,
    required: true,
  },
  mensaje: {
    type: String,
    required: true,
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

const MensajeDoctor = mongoose.model('MensajeDoctor', MensajeDoctorSchema);
module.exports = MensajeDoctor;