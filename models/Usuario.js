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
    tipoUsuario: {
        type: String,
        required: false,
    },
    telefono:{
        type: Number,
        required: true
    }
});


module.exports = mongoose.model('Usuario',UsuarioSchema);