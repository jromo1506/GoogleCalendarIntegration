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
    nombreReferido: {
        type: String,
        required: true
    },
    horario: {
        type: String,
        required: true
    },
    nombreCompleto: {
        type: String,
        required: true
    },
    fechaNac: {
        type: Date,
        required: true
    },
    correoElectronico: { //condicion medica actual
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    apodo: { //motivo de la consulta
        type: String,
        required: true
    },
    condicion: {
        type: String,
        required: true
    },
    motivoVisita: {
        type: String,
        required: true
    },


});

const Paciente = mongoose.model('Paciente', PacienteSchema);
module.exports = Paciente;