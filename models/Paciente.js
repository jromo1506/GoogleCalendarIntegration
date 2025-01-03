const mongoose = require('mongoose');

const PacienteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },

    nombrePac: { //nombre paciente
        type: String,
        required: true
    },

    telefono: {
        type: Number,
        required: true
    },
    nombreAge: { //nombre de quien agenda la cita
        type: String,
        required: true
    },
    fechNac: {
        type: Date,
        required: true
    },
    apodo: {
        type: String,
        required: true
    },
    condicion: { //condicion medica actual
        type: String,
        required: true
    },
    motivo: { //motivo de la consulta
        type: String,
        required: true
    },
    turno: {
        type: String,
        required: true
    },
    horario: {
        type: String,
        required: true
    },


});

const Paciente = mongoose.model('Paciente', PacienteSchema);

module.exports = Paciente;