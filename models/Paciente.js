const mongoose = require('mongoose');

const PacienteSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        unique: true
    },
    telefonoWhatsapp: {
        type: String,
        required: true,
        unique: true
    },

});

const Paciente = mongoose.model('Paciente', PacienteSchema);
module.exports = Paciente;