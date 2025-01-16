const mongoose = require('mongoose');
const {Schema} = mongoose;

const CitasSchema = new Schema({
    idPaciente:{
        type:String,
        required:true
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
    }
});


module.exports = mongoose.model('Citas',CitasSchema);