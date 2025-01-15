const mongoose = require('mongoose');
const {Schema} = mongoose;

const CitasSchema = new Schema({
    id:{
        type: String,
        required: false,
    },
    tratamiento: {
        type: String,
        required: true,
    },
    observaciones:{
        type:String,
        required:false,
    },
    pago:{
        type:Number,
        required:false,
    },
    horaInicio:{
        type:String,
        required:false,
    },
    horaFin:{
        type:String,
        required:false,
    },
    realizo:{
        type:String,
        required:false
    },
    pacienteId: { // Este es el campo que se referirá al paciente
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Paciente', // Esto indica que el campo pacienteId hace referencia al modelo 'Paciente'
        required: true // Este campo es obligatorio
    }
});


module.exports = mongoose.model('Citas',CitasSchema);