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
        required: true,
    },
    horario: {
        type: String,
        required: true,
    },
    apeM: {
        type: String,
        required: true,
    },
    apeP: {
        type: String,
        required: true,
    },
    genero: {
        type: String,
        required: true
    },
    fechaNac: {
        type: Date,
        required: true
    },
    correoElectronico: {
        type: String,
        required: true
    },
    apodo: {
        type: String,
        required: true,
    },
    condicion: {
        type: String,
        required: true,
    },
    motivoVisita: {
        type: String,
        required: true,
    },
    nombreTutor: {
        type: String,
        required: false,
    },

    altura: {
        type: Number,
        required: false,
    },
    peso: {
        type: Number,
        required: false,
    },
    direccion: {
        type: String,
        required: false
    },

    // Datos complementarios front end
    medicamentos: {
        type: String,
        required: false
    },
    alergias: {
        type: String,
        required: false
    },
    idDoctor: {
        type: String,
        required: false
    }

});

const Paciente = mongoose.model('Paciente', PacienteSchema);
module.exports = Paciente;