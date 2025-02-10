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
    //Si el tipo es doctor
    //Si el tipo es recepcinista
    //Si el tipo es admin
    tipo: {
        type: String,
        required: true
    },
    
    especialidad: {
        type: String,
        required: false,
        default:""
    },
    idPacientes: [//ids de pacientes en caso que el tipo de usuario sea Doctor
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Paciente',
        },
    ],
});


module.exports = mongoose.model('Usuario',UsuarioSchema);