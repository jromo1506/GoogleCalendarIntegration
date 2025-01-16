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
<<<<<<< HEAD
    //Tipo: Admin, Recepcionista, Doctor
=======
    //Si el tipo es doctor
    //Si el tipo es recepcinista
    //Si el tipo es admin
>>>>>>> d205aa2c62ea6996936118f394a6b6c3aef20ed2
    tipo: {
        type: String,
        required: true
    },
    
    especialidad: {
        type: String,
        required: false,
        default:""
    },
});


module.exports = mongoose.model('Usuario',UsuarioSchema);