const mongoose = require('mongoose');
const {Schema} = mongoose;

const UsuarioSchema = new Schema({
    
    usuario: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    nombre: {
        type: String,
        required: true
    },
    apeP: {
        type: String,
        required: true
    },
    apeM: {
        type: String,
        required: false,
    },
    telefono:{
        type: Number,
        required: true
    },
    correo: {
        type: String,
        required: true
    },
    especialidad: {
        type: String,
        required: true
    },
});


module.exports = mongoose.model('Usuario',UsuarioSchema);